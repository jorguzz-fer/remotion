import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  captionsPathFor,
  isInside,
  isTranscribable,
} from "./lib/media-files.ts";
import {
  WHISPER_LANG,
  WHISPER_MODEL,
  WHISPER_PATH,
  WHISPER_VERSION,
} from "./whisper-config.ts";

const args = process.argv.slice(2);
const force = args.includes("--force");
const targets = args.filter((arg) => arg !== "--force");
if (targets.length === 0) {
  console.error(
    "Uso: npm run transcribe -- <arquivo ou pasta dentro de public/>... [--force]",
  );
  process.exit(1);
}

const root = process.cwd();
const publicDir = path.join(root, "public");
const tempDir = path.join(root, "temp");
const remotionBin = path.join(root, "node_modules", ".bin", "remotion");

const collectFiles = (target: string): string[] => {
  const full = path.resolve(target);
  if (!fs.existsSync(full)) {
    console.warn(`Ignorando (não existe): ${target}`);
    return [];
  }
  if (fs.statSync(full).isDirectory()) {
    return fs
      .readdirSync(full)
      .flatMap((entry) => collectFiles(path.join(full, entry)));
  }
  if (!isInside(full, publicDir)) {
    console.warn(`Ignorando (fora de public/): ${target}`);
    return [];
  }
  return isTranscribable(full) ? [full] : [];
};

const files = targets.flatMap(collectFiles);
const pending = files.filter(
  (file) => force || !fs.existsSync(captionsPathFor(file)),
);
if (pending.length === 0) {
  console.log(
    "Nada a transcrever: todos os arquivos já têm .json ao lado (use --force para refazer).",
  );
  process.exit(0);
}

await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });
await downloadWhisperModel({ folder: WHISPER_PATH, model: WHISPER_MODEL });
fs.mkdirSync(tempDir, { recursive: true });

for (const file of pending) {
  const wav = path.join(
    tempDir,
    `${path.basename(file, path.extname(file))}.wav`,
  );
  console.log(`Transcrevendo ${path.relative(root, file)}`);
  execFileSync(
    remotionBin,
    ["ffmpeg", "-y", "-i", file, "-ar", "16000", "-ac", "1", wav],
    {
      stdio: ["ignore", "ignore", "inherit"],
    },
  );
  const whisperCppOutput = await transcribe({
    inputPath: wav,
    model: WHISPER_MODEL,
    whisperPath: WHISPER_PATH,
    whisperCppVersion: WHISPER_VERSION,
    tokenLevelTimestamps: true,
    splitOnWord: true,
    language: WHISPER_LANG,
    translateToEnglish: false,
    printOutput: false,
  });
  const { captions } = toCaptions({ whisperCppOutput });
  const out = captionsPathFor(file);
  fs.writeFileSync(out, JSON.stringify(captions, null, 2));
  console.log(`  -> ${path.relative(root, out)} (${captions.length} palavras)`);
}
fs.rmSync(tempDir, { recursive: true, force: true });
