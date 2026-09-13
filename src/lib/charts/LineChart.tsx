import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../../theme/colors";
import { layoutLinePoints, pointsToPath, type Datum } from "./chart-geometry";

type Props = {
  data: Datum[];
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  showArea?: boolean;
  enterDurationInFrames?: number;
};

// Linha revelada da esquerda para a direita (strokeDasharray com pathLength=1),
// com pontos que aparecem conforme a linha chega neles e área opcional embaixo.
export const LineChart: React.FC<Props> = ({
  data,
  width,
  height,
  color = colors.accent,
  strokeWidth = 8,
  showDots = true,
  showArea = true,
  enterDurationInFrames = 45,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, enterDurationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const inset = strokeWidth * 2;
  const points = layoutLinePoints({
    data,
    width: width - inset * 2,
    height: height - inset * 2,
  }).map((p) => ({ ...p, x: p.x + inset, y: p.y + inset }));
  const path = pointsToPath(points);
  const last = points[points.length - 1];
  const areaPath =
    points.length > 1 && last
      ? `${path} L ${last.x} ${height - inset} L ${points[0].x} ${height - inset} Z`
      : "";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      {showArea && areaPath ? (
        <path d={areaPath} fill={color} opacity={0.15 * progress} />
      ) : null}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      {showDots
        ? points.map((p, i) => {
            const threshold = points.length === 1 ? 0 : i / (points.length - 1);
            return (
              <circle
                key={`${p.label}-${i}`}
                cx={p.x}
                cy={p.y}
                r={strokeWidth * 0.9}
                fill={color}
                opacity={progress >= threshold ? 1 : 0}
              />
            );
          })
        : null}
    </svg>
  );
};
