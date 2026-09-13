import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../../theme/colors";
import { fontFamily } from "../../theme/fonts";
import { layoutBars, type Datum } from "./chart-geometry";
import { formatNumber } from "./format-number";

type Props = {
  data: Datum[];
  width: number;
  height: number;
  color?: string;
  labelColor?: string;
  enterDurationInFrames?: number;
  staggerFrames?: number;
  formatValue?: (value: number) => string;
};

// Barras verticais que crescem do zero, uma atrás da outra (stagger).
// O valor aparece acima da barra quando ela passa de 90% da altura final.
export const BarChart: React.FC<Props> = ({
  data,
  width,
  height,
  color = colors.primary,
  labelColor = colors.text,
  enterDurationInFrames = 30,
  staggerFrames = 4,
  formatValue = (value) => formatNumber(value),
}) => {
  const frame = useCurrentFrame();
  const fontSize = Math.round(width * 0.035);
  const valueSpace = Math.round(fontSize * 1.6);
  const labelSpace = Math.round(fontSize * 1.8);
  const chartHeight = height - valueSpace - labelSpace;
  const bars = layoutBars({ data, width, height: chartHeight });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      {bars.map((bar) => {
        const grow = interpolate(
          frame,
          [
            bar.index * staggerFrames,
            bar.index * staggerFrames + enterDurationInFrames,
          ],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          },
        );
        const barHeight = bar.height * grow;
        const y = valueSpace + chartHeight - barHeight;
        const centerX = bar.x + bar.width / 2;
        return (
          <g key={`${bar.label}-${bar.index}`}>
            <rect
              x={bar.x}
              y={y}
              width={bar.width}
              height={barHeight}
              rx={Math.min(16, bar.width / 4)}
              fill={color}
            />
            <text
              x={centerX}
              y={y - fontSize * 0.4}
              textAnchor="middle"
              fontFamily={fontFamily}
              fontSize={fontSize}
              fontWeight={600}
              fill={labelColor}
              opacity={grow > 0.9 ? 1 : 0}
            >
              {formatValue(bar.value)}
            </text>
            <text
              x={centerX}
              y={height - fontSize * 0.4}
              textAnchor="middle"
              fontFamily={fontFamily}
              fontSize={fontSize}
              fill={labelColor}
              opacity={0.8}
            >
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
