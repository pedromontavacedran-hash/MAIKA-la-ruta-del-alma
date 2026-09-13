import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "public", "logos", "logo web lila3.png");
const dest = path.join(root, "public", "icon.ico");

if (!fs.existsSync(src)) {
  console.error("No existe el PNG:", src);
  process.exit(1);
}

const buf = await pngToIco([fs.readFileSync(src)]);
fs.writeFileSync(dest, buf);
console.log("Icono Windows:", dest);
