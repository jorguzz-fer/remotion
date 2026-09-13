import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  getRemotionEnvironment,
  Sequence,
  useDelayRender,
  useVideoConfig,
  watchStaticFile,
} from "remotion";
import { colors } from "../../theme/colors";
import { fontFamily } from "../../theme/fonts";
import { getPageTimings } from "./caption-pages";
import { CaptionPage } from "./CaptionPage";

type Props = {
  src: string;
  switchEveryMs?: number;
  highlightColor?: string;
  position?: "bottom" | "center";
};

// Carrega um JSON no formato Caption[] (gerado por `npm run transcribe`) e mostra
// legendas estilo TikTok. Arquivo ausente: aviso vermelho no Studio; erro no render.
export const Captions: React.FC<Props> = ({
  src,
  switchEveryMs = 1200,
  highlightColor = colors.accent,
  position = "bottom",
}) => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [missing, setMissing] = useState(false);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender(`Carregando legendas de ${src}`));
  const { fps, width } = useVideoConfig();

  const load = useCallback(async () => {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as Caption[];
      if (!Array.isArray(data)) {
        throw new Error("o JSON não é uma lista de legendas");
      }
      setCaptions(data);
      setMissing(false);
      continueRender(handle);
    } catch (error) {
      const message = `Legendas não encontradas em ${src} (${(error as Error).message}). Gere com: npm run transcribe -- <áudio>`;
      if (getRemotionEnvironment().isRendering) {
        cancelRender(new Error(message));
        return;
      }
      setMissing(true);
      setCaptions([]);
      continueRender(handle);
    }
  }, [src, handle, continueRender, cancelRender]);

  useEffect(() => {
    load();
    const watcher = watchStaticFile(src, () => {
      load();
    });
    return () => {
      watcher.cancel();
    };
  }, [load, src]);

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions: captions ?? [],
        combineTokensWithinMilliseconds: switchEveryMs,
      }),
    [captions, switchEveryMs],
  );
  const timings = useMemo(
    () => getPageTimings({ pages, fps, switchEveryMs }),
    [pages, fps, switchEveryMs],
  );

  if (missing) {
    return (
      <AbsoluteFill
        name="Legendas ausentes"
        style={{ justifyContent: "flex-start", alignItems: "stretch" }}
      >
        <div
          style={{
            margin: 24,
            padding: "16px 24px",
            borderRadius: 12,
            backgroundColor: "#B91C1C",
            color: "white",
            fontFamily,
            fontSize: Math.round(width * 0.028),
            lineHeight: 1.3,
          }}
        >
          {`Legendas não encontradas: ${src}. Rode: npm run transcribe -- public/<slug>/voiceover`}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill name="Legendas" style={{ pointerEvents: "none" }}>
      {pages.map((page, index) => {
        const timing = timings[index];
        if (!timing || timing.durationInFrames <= 0) {
          return null;
        }
        return (
          <Sequence
            key={`${page.startMs}-${index}`}
            name={`Legenda ${index + 1}`}
            from={timing.from}
            durationInFrames={timing.durationInFrames}
          >
            <CaptionPage
              page={page}
              highlightColor={highlightColor}
              position={position}
              fontSize={Math.round(width * 0.055)}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
