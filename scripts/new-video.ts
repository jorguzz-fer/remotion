import fs from "node:fs";
import path from "node:path";
import { insertVideoIntoRoot } from "./lib/root-insert.ts";
import { isValidSlug, toPascalCase } from "./lib/slug.ts";
import { renderTemplate } from "./lib/template.ts";

const args = process.argv.slice(2);
const slug = args[0];
const titleIndex = args.indexOf("--title");
const title = titleIndex === -1 ? null : (args[titleIndex + 1] ?? null);

if (!slug || slug.startsWith("--")) {
  console.error('Uso: npm run new-video -- <slug> [--title "Título do vídeo"]');
  process.exit(1);
}
if (!isValidSlug(slug)) {
  console.error(
    `Slug inválido: "${slug}". Use letras minúsculas, números e hífens, por exemplo: lancamento-app`,
  );
  process.exit(1);
}

const root = process.cwd();
const videoDir = path.join(root, "src", "videos", slug);
if (fs.existsSync(videoDir)) {
  console.error(`Já existe: ${path.relative(root, videoDir)}`);
  process.exit(1);
}

const pascal = toPascalCase(slug);
const vars = {
  slug,
  Slug: pascal,
  Titulo: (title ?? slug).replace(/"/g, '\\"'),
};
const templateDir = path.join(root, "scripts", "templates", "video");

const writeFromTemplate = (templateFile: string, outFile: string) => {
  const source = fs.readFileSync(path.join(templateDir, templateFile), "utf8");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, renderTemplate(source, vars));
  console.log(`  criado ${path.relative(root, outFile)}`);
};

console.log(`Criando vídeo "${slug}" (${pascal})`);
writeFromTemplate("index.tsx.tmpl", path.join(videoDir, "index.tsx"));
writeFromTemplate("schema.ts.tmpl", path.join(videoDir, "schema.ts"));
writeFromTemplate(
  "scenes/Intro.tsx.tmpl",
  path.join(videoDir, "scenes", "Intro.tsx"),
);
writeFromTemplate(
  "scenes/Outro.tsx.tmpl",
  path.join(videoDir, "scenes", "Outro.tsx"),
);
writeFromTemplate(
  "roteiro.json.tmpl",
  path.join(root, "public", slug, "voiceover", "roteiro.json"),
);

const rootFile = path.join(root, "src", "Root.tsx");
const result = insertVideoIntoRoot(fs.readFileSync(rootFile, "utf8"), {
  slug,
  pascal,
});
if (result.inserted) {
  fs.writeFileSync(rootFile, result.source);
  console.log("  registrado em src/Root.tsx");
} else if (result.reason === "already-registered") {
  console.log("  src/Root.tsx já registra este vídeo");
} else {
  console.log(
    `  Marcador não encontrado em src/Root.tsx. Adicione manualmente:\n` +
      `    import { ${pascal}Compositions } from "./videos/${slug}";\n` +
      `    <${pascal}Compositions />`,
  );
}

console.log(
  `\nPronto. Abra o Studio com: npm run dev  ->  http://localhost:3000/${pascal}-Vertical`,
);
