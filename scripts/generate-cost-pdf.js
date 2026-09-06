/**
 * Print docs/infrastructure-costs-2026.html to PDF via Puppeteer.
 * Usage: node scripts/generate-cost-pdf.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HTML = path.join(ROOT, "docs", "infrastructure-costs-2026.html");
const PDF = path.join(ROOT, "docs", "infrastructure-costs-2026.pdf");

async function main() {
  if (!fs.existsSync(HTML)) {
    console.error("Missing:", HTML);
    process.exit(1);
  }

  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    console.error(
      "Puppeteer not installed. Run: npm install --no-save puppeteer",
    );
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file:///${HTML.replace(/\\/g, "/")}`, {
      waitUntil: "networkidle0",
    });
    await page.pdf({
      path: PDF,
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
    console.log("Wrote:", PDF);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
