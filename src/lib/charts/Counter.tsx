import type { CSSProperties } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { formatNumber } from "./format-number";

type Props = {
  to: number;
  from?: number;
  durationInFrames?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  style?: CSSProperties;
};

// Número que sobe de `from` até `to` com desaceleração. durationInFrames deve ser > 0.
export const Counter: React.FC<Props> = ({
  to,
  from = 0,
  durationInFrames = 45,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = "pt-BR",
  style,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const value = from + (to - from) * progress;

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {formatNumber(value, { decimals, locale, prefix, suffix })}
    </span>
  );
};
