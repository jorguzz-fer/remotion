import path from "node:path";

export const TRANSCRIBABLE_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".mp4",
  ".mov",
  ".webm",
  ".mkv",
];

export const isTranscribable = (file: string): boolean =>
  TRANSCRIBABLE_EXTENSIONS.includes(path.extname(file).toLowerCase());

// O JSON de legendas fica ao lado do áudio, com o mesmo nome.
export const captionsPathFor = (file: string): string =>
  file.replace(/\.[^./\\]+$/, ".json");

export const isInside = (file: string, dir: string): boolean => {
  const relative = path.relative(path.resolve(dir), path.resolve(file));
  return (
    relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)
  );
};
