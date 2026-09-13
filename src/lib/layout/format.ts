export type Format = "vertical" | "horizontal" | "square";

// Altura maior que largura é vertical; largura maior é horizontal; iguais é square.
export const getFormat = (width: number, height: number): Format => {
  if (height > width) {
    return "vertical";
  }
  if (width > height) {
    return "horizontal";
  }
  return "square";
};

export type SafeAreaMetrics = {
  paddingX: number;
  paddingY: number;
  baseFontSize: number;
};

// Regras da skill remotion-create/video-layout.md: 80px laterais e 100px vertical
// para 1080 de largura, escalados pela largura real. O fontSize base (1em) é 4,1% da
// largura, então "2em" dá 88px em 1080 (título) e "1em" dá 44px (texto de apoio).
export const getSafeAreaMetrics = (width: number): SafeAreaMetrics => ({
  paddingX: Math.round((width * 80) / 1080),
  paddingY: Math.round((width * 100) / 1080),
  baseFontSize: Math.round(width * 0.041),
});
