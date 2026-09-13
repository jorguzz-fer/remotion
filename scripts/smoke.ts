import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

// Renderiza o frame do meio de cada composition em out/smoke/. Se alguma quebrar,
// o script falha listando os ids. É o teste de fumaça do projeto.
const root = process.cwd();
const outDir = path.join(root, "out", "smoke");
fs.mkdirSync(outDir, { recursive: true });

console.log("Empacotando o projeto...");
const serveUrl = await bundle({
  entryPoint: path.join(root, "src", "index.ts"),
  publicDir: path.join(root, "public"),
  onProgress: () => undefined,
});

const compositions = await getCompositions(serveUrl);
console.log(`${compositions.length} compositions encontradas`);

const failures: string[] = [];
for (const composition of compositions) {
  const output = path.join(outDir, `${composition.id}.png`);
  try {
    await renderStill({
      composition,
      serveUrl,
      output,
      frame: Math.floor(composition.durationInFrames / 2),
      scale: 0.25,
    });
    console.log(
      `  ok      ${composition.id}  -> ${path.relative(root, output)}`,
    );
  } catch (error) {
    failures.push(composition.id);
    console.error(`  FALHOU  ${composition.id}`);
    console.error(error);
  }
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length} composition(s) com erro: ${failures.join(", ")}`,
  );
  process.exit(1);
}
console.log("\nTodas as compositions renderizaram um still.");
