import { bundle } from "@remotion/bundler";
import { ensureBrowser, getCompositions } from "@remotion/renderer";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { extractApiKey, isAuthorized } from "./auth.ts";
import { makeRenderQueue } from "./render-queue.ts";
import { cleanupRenders } from "./retention.ts";
import { parseRenderRequest } from "./validate.ts";

// API de render. Rotas (todas exigem x-api-key, exceto /health):
//   GET    /health                 estado do servidor
//   GET    /compositions           compositions disponíveis
//   POST   /renders                { compositionId, inputProps? } -> 202 { jobId, statusUrl, downloadUrl }
//   GET    /renders/:id            status e progresso
//   GET    /renders/:id/download   mp4 quando status = completed
//   DELETE /renders/:id            cancela um job na fila ou em andamento

const port = Number(process.env.PORT ?? 3000);
const apiKey = process.env.RENDER_API_KEY ?? "";
const rendersDir = path.resolve(process.env.RENDERS_DIR ?? "renders");
const ttlHours = Number(process.env.RENDER_TTL_HOURS ?? 72);
const concurrency = process.env.RENDER_CONCURRENCY
  ? Number(process.env.RENDER_CONCURRENCY)
  : null;

if (!apiKey) {
  console.error(
    "Defina RENDER_API_KEY antes de subir a API (ex.: openssl rand -hex 32).",
  );
  process.exit(1);
}
fs.mkdirSync(rendersDir, { recursive: true });

const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  if (isAuthorized(extractApiKey(req.headers), apiKey)) {
    next();
    return;
  }
  res.status(401).json({ error: "chave inválida: envie o header x-api-key" });
};

// O Express 5 tipa params repetidos como string[]; aqui só existe um :id.
const idParam = (value: string | string[]): string =>
  Array.isArray(value) ? (value[0] ?? "") : value;

const startedAt = Date.now();
await ensureBrowser();
const serveUrl =
  process.env.REMOTION_SERVE_URL ??
  (await bundle({
    entryPoint: path.resolve("src/index.ts"),
    publicDir: path.resolve("public"),
    onProgress: () => undefined,
  }));
const compositions = await getCompositions(serveUrl);
const compositionIds = compositions.map((composition) => composition.id);
const queue = makeRenderQueue({ serveUrl, rendersDir, concurrency });

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    compositions: compositionIds.length,
    jobs: queue.counts(),
  });
});

app.get("/compositions", requireApiKey, (_req, res) => {
  res.json(
    compositions.map(({ id, width, height, fps, durationInFrames }) => ({
      id,
      width,
      height,
      fps,
      durationInFrames,
    })),
  );
});

app.post("/renders", requireApiKey, (req, res) => {
  const parsed = parseRenderRequest(req.body, compositionIds);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const job = queue.createJob(
    parsed.value.compositionId,
    parsed.value.inputProps,
  );
  res.status(202).json({
    jobId: job.id,
    status: job.status,
    statusUrl: `/renders/${job.id}`,
    downloadUrl: `/renders/${job.id}/download`,
  });
});

app.get("/renders/:id", requireApiKey, (req, res) => {
  const job = queue.getJob(idParam(req.params.id));
  if (!job) {
    res.status(404).json({ error: "job não encontrado" });
    return;
  }
  const { outputPath, ...publicJob } = job;
  res.json({
    ...publicJob,
    downloadUrl:
      job.status === "completed" && outputPath
        ? `/renders/${job.id}/download`
        : null,
  });
});

app.get("/renders/:id/download", requireApiKey, (req, res) => {
  const job = queue.getJob(idParam(req.params.id));
  if (!job) {
    res.status(404).json({ error: "job não encontrado" });
    return;
  }
  if (job.status !== "completed" || !job.outputPath) {
    res
      .status(409)
      .json({ error: `render ainda não concluído (status: ${job.status})` });
    return;
  }
  if (!fs.existsSync(job.outputPath)) {
    res
      .status(410)
      .json({ error: "o arquivo já foi removido pela limpeza automática" });
    return;
  }
  res.download(job.outputPath, `${job.compositionId}-${job.id}.mp4`);
});

app.delete("/renders/:id", requireApiKey, (req, res) => {
  if (!queue.cancelJob(idParam(req.params.id))) {
    res.status(409).json({ error: "job não encontrado ou não cancelável" });
    return;
  }
  res.json({ ok: true });
});

const runCleanup = () => {
  const removed = cleanupRenders(rendersDir, ttlHours);
  if (removed.length > 0) {
    console.log(
      `Limpeza: ${removed.length} render(s) com mais de ${ttlHours} h removido(s)`,
    );
  }
};
runCleanup();
setInterval(runCleanup, 60 * 60 * 1000).unref();

app.listen(port, "0.0.0.0", () => {
  console.log(
    `API de render na porta ${port}. Compositions: ${compositionIds.join(", ")}`,
  );
  console.log(`Renders em ${rendersDir} (TTL ${ttlHours} h)`);
});
