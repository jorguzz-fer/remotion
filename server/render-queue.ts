import {
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import { randomUUID } from "node:crypto";
import path from "node:path";

export type JobStatus =
  | "queued"
  | "in-progress"
  | "completed"
  | "failed"
  | "cancelled";

export type Job = {
  id: string;
  compositionId: string;
  inputProps: Record<string, unknown>;
  status: JobStatus;
  progress: number;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
  outputPath: string | null;
};

type Entry = { job: Job; cancel: (() => void) | null };

// Fila serial: um render por vez, adequado a um VPS pequeno. Estado em memória.
export const makeRenderQueue = ({
  serveUrl,
  rendersDir,
  concurrency,
}: {
  serveUrl: string;
  rendersDir: string;
  concurrency: number | null;
}) => {
  const entries = new Map<string, Entry>();
  let chain: Promise<unknown> = Promise.resolve();

  const update = (id: string, patch: Partial<Job>) => {
    const entry = entries.get(id);
    if (entry) {
      entry.job = { ...entry.job, ...patch };
    }
  };

  const processJob = async (id: string) => {
    const entry = entries.get(id);
    if (!entry || entry.job.status !== "queued") {
      return;
    }
    const { cancel, cancelSignal } = makeCancelSignal();
    entry.cancel = cancel;
    update(id, { status: "in-progress" });
    const { compositionId, inputProps } = entry.job;
    const outputPath = path.join(rendersDir, `${id}.mp4`);
    console.log(`[${id}] renderizando ${compositionId}`);
    try {
      const composition = await selectComposition({
        serveUrl,
        id: compositionId,
        inputProps,
      });
      await renderMedia({
        composition,
        serveUrl,
        inputProps,
        codec: "h264",
        outputLocation: outputPath,
        cancelSignal,
        concurrency,
        onProgress: ({ progress }) => update(id, { progress }),
      });
      update(id, {
        status: "completed",
        progress: 1,
        outputPath,
        finishedAt: new Date().toISOString(),
      });
      console.log(`[${id}] concluído`);
    } catch (error) {
      const wasCancelled = entries.get(id)?.job.status === "cancelled";
      const message = error instanceof Error ? error.message : String(error);
      update(id, {
        status: wasCancelled ? "cancelled" : "failed",
        error: wasCancelled ? null : message,
        finishedAt: new Date().toISOString(),
      });
      console.error(
        `[${id}] ${wasCancelled ? "cancelado" : `falhou: ${message}`}`,
      );
    } finally {
      entry.cancel = null;
    }
  };

  const createJob = (
    compositionId: string,
    inputProps: Record<string, unknown>,
  ): Job => {
    const id = randomUUID();
    const job: Job = {
      id,
      compositionId,
      inputProps,
      status: "queued",
      progress: 0,
      error: null,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      outputPath: null,
    };
    entries.set(id, { job, cancel: null });
    chain = chain.then(() => processJob(id)).catch(() => undefined);
    return job;
  };

  const cancelJob = (id: string): boolean => {
    const entry = entries.get(id);
    if (!entry) {
      return false;
    }
    if (entry.job.status === "queued") {
      update(id, { status: "cancelled", finishedAt: new Date().toISOString() });
      return true;
    }
    if (entry.job.status === "in-progress" && entry.cancel) {
      update(id, { status: "cancelled" });
      entry.cancel();
      return true;
    }
    return false;
  };

  const getJob = (id: string): Job | null => entries.get(id)?.job ?? null;

  const counts = () => {
    const result = {
      queued: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const { job } of entries.values()) {
      if (job.status === "queued") result.queued += 1;
      else if (job.status === "in-progress") result.inProgress += 1;
      else if (job.status === "completed") result.completed += 1;
      else if (job.status === "failed") result.failed += 1;
      else result.cancelled += 1;
    }
    return result;
  };

  return { createJob, cancelJob, getJob, counts };
};
