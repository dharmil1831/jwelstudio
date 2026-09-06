const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const envPath = path.join(__dirname, "..", ".env");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  let k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!process.env[k]) process.env[k] = v;
}

const prisma = new PrismaClient();

prisma.generation
  .findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      createdAt: true,
      resultUrl: true,
      mode: true,
      format: true,
      status: true,
      user: { select: { email: true } },
    },
  })
  .then(async (rows) => {
    for (const g of rows) {
      const ext = (g.resultUrl.split(".").pop() || "").split("?")[0];
      let contentType = "?";
      try {
        const head = await fetch(g.resultUrl, { method: "HEAD" });
        contentType = head.headers.get("content-type") || String(head.status);
      } catch (e) {
        contentType = "fetch-failed";
      }
      // Heuristic: Gemini usually JPEG; OpenAI images.edit usually PNG
      let guess = "unknown";
      if (/jpeg|jpg/i.test(contentType) || ext === "jpg" || ext === "jpeg") {
        guess = "likely-gemini";
      } else if (/png/i.test(contentType) || ext === "png") {
        guess = "likely-openai-or-png";
      }
      console.log(
        [
          g.createdAt.toISOString(),
          g.user.email,
          g.mode,
          g.format,
          g.status,
          "ext=" + ext,
          "type=" + contentType,
          guess,
        ].join(" | "),
      );
    }
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("FAIL " + e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
