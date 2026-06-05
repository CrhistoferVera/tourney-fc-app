import sharp from "sharp";
import path from "node:path";

const dir = path.join(process.cwd(), "assets", "images");
const SIZE = 1024;
const SAFE = 0.84; // la copa ocupa ~84% para no salirse de la zona segura
const GREEN = { r: 0x15, g: 0x76, b: 0x40 }; // #157640

const inner = Math.round(SIZE * SAFE);

// Logo (copa) escalado manteniendo proporción
const logo = await sharp(path.join(dir, "icon.png"))
  .resize(inner, inner, { fit: "contain", background: { ...GREEN, alpha: 0 } })
  .toBuffer();

// FOREGROUND: lienzo verde + copa centrada (la copa queda dentro de la zona segura,
// el verde llega a los bordes y se recorta limpio con la máscara del ícono)
await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: { ...GREEN, alpha: 1 } },
})
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile(path.join(dir, "android-icon-foreground.png"));

// BACKGROUND: verde sólido (lo que se vea en las esquinas será verde, no celeste)
await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: { ...GREEN, alpha: 1 } },
})
  .png()
  .toFile(path.join(dir, "android-icon-background.png"));

console.log("OK -> foreground y background regenerados (verde #157640, copa centrada)");
