import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { colors } from "../../theme/colors";
import { fontFamily } from "../../theme/fonts";
import { getSafeAreaMetrics } from "./format";

type Props = {
  children: ReactNode;
  style?: CSSProperties;
  name?: string;
};

// Container de cena: aplica a margem segura e define o fontSize base (1em).
// Os filhos escrevem tamanhos em "em" e ficam proporcionais em qualquer formato.
export const SafeArea: React.FC<Props> = ({ children, style, name }) => {
  const { width } = useVideoConfig();
  const { paddingX, paddingY, baseFontSize } = getSafeAreaMetrics(width);

  return (
    <AbsoluteFill
      name={name ?? "Área segura"}
      style={{
        boxSizing: "border-box",
        paddingLeft: paddingX,
        paddingRight: paddingX,
        paddingTop: paddingY,
        paddingBottom: paddingY,
        fontSize: baseFontSize,
        fontFamily,
        color: colors.text,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
