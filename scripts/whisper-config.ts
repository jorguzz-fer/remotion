import type { Language, WhisperModel } from "@remotion/install-whisper-cpp";
import path from "node:path";

// Onde o Whisper.cpp é clonado e compilado (pasta ignorada pelo git).
export const WHISPER_PATH = path.join(process.cwd(), "whisper.cpp");

// 1.6.0 compila só com git e make. Versões 1.7.4+ exigem cmake, que não está instalado
// nesta máquina. O modelo large-v3-turbo exige 1.7.2+.
export const WHISPER_VERSION = "1.6.0";

// Modelos multilíngues (sem ".en"): tiny (75 MB), base (142 MB), small (466 MB),
// medium (1,5 GB), large-v3 (2,9 GB). Para testar rápido, troque para "small".
export const WHISPER_MODEL: WhisperModel = "medium";

export const WHISPER_LANG: Language = "pt";
