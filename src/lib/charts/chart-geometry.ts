export type Datum = { label: string; value: number };

export type BarBox = {
  index: number;
  label: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Distribui as barras em fatias iguais da largura. A barra do maior valor ocupa
// a altura toda; as outras são proporcionais. gapRatio é a fração da fatia que fica vazia.
export const layoutBars = ({
  data,
  width,
  height,
  gapRatio = 0.35,
}: {
  data: Datum[];
  width: number;
  height: number;
  gapRatio?: number;
}): BarBox[] => {
  if (data.length === 0) {
    return [];
  }
  const max = Math.max(0, ...data.map((d) => d.value));
  const slot = width / data.length;
  const barWidth = slot * (1 - gapRatio);
  return data.map((d, index) => {
    const barHeight = max === 0 ? 0 : (Math.max(0, d.value) / max) * height;
    return {
      index,
      label: d.label,
      value: d.value,
      x: index * slot + (slot - barWidth) / 2,
      y: height - barHeight,
      width: barWidth,
      height: barHeight,
    };
  });
};

export type Point = { x: number; y: number; label: string; value: number };

// Pontos de uma linha: x igualmente espaçado, y invertido (0 no topo do SVG).
export const layoutLinePoints = ({
  data,
  width,
  height,
}: {
  data: Datum[];
  width: number;
  height: number;
}): Point[] => {
  if (data.length === 0) {
    return [];
  }
  const max = Math.max(0, ...data.map((d) => d.value));
  const stepX = data.length === 1 ? 0 : width / (data.length - 1);
  return data.map((d, index) => ({
    label: d.label,
    value: d.value,
    x: index * stepX,
    y: max === 0 ? height : height - (Math.max(0, d.value) / max) * height,
  }));
};

export const pointsToPath = (points: Point[]): string =>
  points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
