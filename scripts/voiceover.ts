import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseRoteiro } from "./lib/roteiro.ts";

const FPS = 30;

const usage = (): never => {
  console.error(
    "Uso: npm run voiceover -- <slug> [--provider macos|elevenlabs] [--voice <nome da voz ou voiceId>]",
  );
  process.exit(1);
};

const args = process.argv.slice(2);
const slug = args[0];
if (!slug || slug.startsWith("--")) {
  usage();
}

const readOption = (name: string): string | null => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : (args[index + 1] ?? null);
};

const forcedProvider = readOption("provider");
if (
  forcedProvider !== null &&
  forcedProvider !== "macos" &&
  forcedProvider !== "elevenlabs"
) {
  usage();
}

const root = process.cwd();
const dir = path.join(root, "public", slug, "voiceover");
const roteiroPath = path.join(dir, "roteiro.json");
if (!fs.existsSync(roteiroPath)) {
  console.error(
    `Roteiro não encontrado: ${path.relative(root, roteiroPath)}\n` +
      'Crie o arquivo com { "voice": "Luciana", "scenes": { "intro": "texto da cena..." } }',
  );
  process.exit(1);
}

const roteiro = parseRoteiro(fs.readFileSync(roteiroPath, "utf8"));
const voice = readOption("voice") ?? roteiro.voice;
const apiKey = process.env.ELEVENLABS_API_KEY ?? "";
const provider = forcedProvider ?? (apiKey ? "elevenlabs" : "macos");

if (provider === "elevenlabs" && !apiKey) {
  console.error(
    "O provider elevenlabs exige ELEVENLABS_API_KEY. Copie .env.example para .env e preencha a chave.",
  );
  process.exit(1);
}
if (provider === "macos" && process.platform !== "darwin") {
  console.error(
    "O provider macos só funciona no macOS. Use --provider elevenlabs.",
  );
  process.exit(1);
}

const tempDir = path.join(root, "temp");
fs.mkdirSync(tempDir, { recursive: true });
const remotionBin = path.join(root, "node_modules", ".bin", "remotion");

const remotion = (cliArgs: string[]): string =>
  execFileSync(remotionBin, cliArgs, {
    stdio: ["ignore", "pipe", "inherit"],
  }).toString();

const durationInSeconds = (file: string): number =>
  Number(
    remotion([
      "ffprobe",
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      file,
    ]).trim(),
  );

const generateMacos = (text: string, out: string) => {
  // O say gera AIFF-C comprimido por padrão, que o ffmpeg do Remotion não lê; pedimos WAV PCM.
  const wav = path.join(tempDir, `${path.basename(out, ".mp3")}.wav`);
  execFileSync(
    "say",
    [
      "-v",
      voice,
      "-o",
      wav,
      "--file-format=WAVE",
      "--data-format=LEI16@22050",
      text,
    ],
    { stdio: "inherit" },
  );
  remotion([
    "ffmpeg",
    "-y",
    "-v",
    "error",
    "-i",
    wav,
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "2",
    out,
  ]);
};

const generateElevenLabs = async (text: string, out: string) => {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `ElevenLabs respondeu ${response.status}: ${await response.text()}`,
    );
  }
  fs.writeFileSync(out, Buffer.from(await response.arrayBuffer()));
};

console.log(`Gerando narração de "${slug}" com ${provider} (voz: ${voice})`);
for (const [scene, text] of Object.entries(roteiro.scenes)) {
  const out = path.join(dir, `${scene}.mp3`);
  if (provider === "macos") {
    generateMacos(text, out);
  } else {
    await generateElevenLabs(text, out);
  }
  const seconds = durationInSeconds(out);
  console.log(
    `  ${scene}.mp3  ${seconds.toFixed(2)} s  =  ${Math.ceil(seconds * FPS)} frames a ${FPS} fps`,
  );
}
fs.rmSync(tempDir, { recursive: true, force: true });
