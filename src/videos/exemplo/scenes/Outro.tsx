import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  staticFile,
  useVideoConfig,
} from "remotion";
import { SafeArea } from "../../../lib/layout/SafeArea";
import { Captions } from "../../../lib/media/Captions";
import { displayFontFamily } from "../../../theme/fonts";

export type OutroProps = {
  cta: string;
  accentColor: string;
};

export const Outro: React.FC<OutroProps> = ({ cta, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Outro" style={{ backgroundColor: "#0B1020" }}>
      <SafeArea
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: "0.8em",
          textAlign: "center",
        }}
      >
        <Interactive.H1
          name="Chamada"
          style={{
            margin: 0,
            fontFamily: displayFontFamily,
            fontSize: "2.2em",
            fontWeight: 800,
            lineHeight: 1.05,
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0, 1 * fps], [0.9, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
            }),
          }}
        >
          {cta}
        </Interactive.H1>
        <Interactive.Div
          name="Botão"
          style={{
            padding: "0.5em 1.2em",
            borderRadius: 999,
            backgroundColor: accentColor,
            color: "#0B1020",
            fontFamily: displayFontFamily,
            fontSize: "1em",
            fontWeight: 800,
            opacity: interpolate(frame, [0.5 * fps, 1 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0.5 * fps, 1.4 * fps], [0.6, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 20 }),
              output: "perceptual-scale",
            }),
          }}
        >
          Abra o Studio
        </Interactive.Div>
        <Interactive.P
          name="Comando"
          style={{
            margin: 0,
            fontFamily: "monospace",
            fontSize: "0.8em",
            color: "#9AA4B8",
            opacity: interpolate(frame, [1 * fps, 1.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          npm run dev
        </Interactive.P>
      </SafeArea>
      <Audio name="Narração" src={staticFile("exemplo/voiceover/outro.mp3")} />
      <Captions src={staticFile("exemplo/voiceover/outro.json")} />
    </AbsoluteFill>
  );
};
