import { useVideoConfig } from "remotion";
import { getFormat, type Format } from "./format";

export type FormatInfo = {
  format: Format;
  width: number;
  height: number;
  isVertical: boolean;
  isHorizontal: boolean;
  isSquare: boolean;
};

// Lê as dimensões da composition atual e diz em qual formato a cena está.
export const useFormat = (): FormatInfo => {
  const { width, height } = useVideoConfig();
  const format = getFormat(width, height);
  return {
    format,
    width,
    height,
    isVertical: format === "vertical",
    isHorizontal: format === "horizontal",
    isSquare: format === "square",
  };
};
