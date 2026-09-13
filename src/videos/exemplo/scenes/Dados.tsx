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
import { BarChart } from "../../../lib/charts/BarChart";
import { Counter } from "../../../lib/charts/Counter";
import { SafeArea } from "../../../lib/layout/SafeArea";
import { Captions } from "../../../lib/media/Captions";
import { useFormat } from "../../../lib/layout/useFormat";
import { displayFontFamily } from "../../../theme/fonts";

export type DadosProps = {
  accentColor: string;
  data: { label: string; value: number }[];
};

export const Dados: React.FC<DadosProps> = ({ accentColor, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isHorizontal, isSquare } = useFormat();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  // Largura interna: 920 no vertical e no square, 1636 no horizontal (metade para o gráfico).
  const chartWidth = isHorizontal ? 760 : 920;
  const chartHeight = isHorizontal ? 520 : isSquare ? 420 : 720;

  return (
    <AbsoluteFill name="Dados" style={{ backgroundColor: "#0B1020" }}>
      <SafeArea
        captionSpace
        style={{
          flexDirection: isHorizontal ? "row" : "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "1em",
        }}
      >
        <Interactive.Div
          name="Texto dos dados"
          style={{
            flex: isHorizontal ? 1 : "0 0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.4em",
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [0, 0.8 * fps],
              ["-60px 0px", "0px 0px"],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              },
            ),
          }}
        >
          <Interactive.H2
            name="Título dos dados"
            style={{
              margin: 0,
              fontFamily: displayFontFamily,
              fontSize: "1.6em",
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            Vídeos publicados por mês
          </Interactive.H2>
          <Interactive.P
            name="Total"
            style={{ margin: 0, fontSize: "0.9em", color: "#9AA4B8" }}
          >
            <Counter
              to={total}
              durationInFrames={60}
              style={{
                display: "block",
                fontFamily: displayFontFamily,
                fontSize: "2.4em",
                fontWeight: 800,
                lineHeight: 1.1,
                color: accentColor,
              }}
            />
            vídeos em cinco meses
          </Interactive.P>
        </Interactive.Div>
        <Interactive.Div
          name="Gráfico"
          style={{
            flex: isHorizontal ? 1 : "0 0 auto",
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <BarChart
            data={data}
            width={chartWidth}
            height={chartHeight}
            color={accentColor}
          />
        </Interactive.Div>
      </SafeArea>
      <Audio name="Narração" src={staticFile("exemplo/voiceover/dados.mp3")} />
      <Captions src={staticFile("exemplo/voiceover/dados.json")} />
    </AbsoluteFill>
  );
};
