const fs = require("fs");
const path = require("path");

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split(/\r?\n/)) {
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
  env[k] = v;
}

const key = env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY;
const model = env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";
if (!key) {
  console.log("NO_KEY");
  process.exit(1);
}

const url =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  encodeURIComponent(model) +
  ":generateContent";

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": key,
  },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: "Reply with the single word OK" }] }],
  }),
})
  .then(async (r) => {
    const t = await r.text();
    console.log("status=" + r.status);
    console.log(t.slice(0, 800));
  })
  .catch((e) => {
    console.log("ERR " + e.message);
    process.exit(1);
  });
