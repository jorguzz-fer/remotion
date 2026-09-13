import type { TikTokPage } from "@remotion/captions";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { displayFontFamily } from "../../theme/fonts";

type Props = {
  page: TikTokPage;
  highlightColor: string;
  position: "bottom" | "center";
  fontSize: number;
};

// Uma página de legenda: as palavras da página, com a palavra falada destacada.
export const CaptionPage: React.FC<Props> = ({
  page,
  highlightColor,
  position,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteTimeMs = page.startMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill
      style={{
        boxSizing: "border-box",
        justifyContent: position === "bottom" ? "flex-end" : "center",
        alignItems: "center",
        paddingBottom: position === "bottom" ? "12%" : 0,
        paddingLeft: "5%",
        paddingRight: "5%",
      }}
    >
      <div
        style={{
          fontFamily: displayFontFamily,
          fontSize,
          fontWeight: 800,
          lineHeight: 1.15,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          color: "white",
          textShadow:
            "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 16px rgba(0,0,0,0.8)",
        }}
      >
        {page.tokens.map((token, index) => {
          const active =
            token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
          return (
            <span
              key={`${token.fromMs}-${index}`}
              style={{ color: active ? highlightColor : "white" }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
