// Curva de volume: rampa linear de entrada, platô, rampa linear de saída até o último frame.
export const fadeVolume = ({
  frame,
  durationInFrames,
  fadeInFrames,
  fadeOutFrames,
  volume,
}: {
  frame: number;
  durationInFrames: number;
  fadeInFrames: number;
  fadeOutFrames: number;
  volume: number;
}): number => {
  const fadeIn = fadeInFrames <= 0 ? 1 : Math.min(1, frame / fadeInFrames);
  const remaining = durationInFrames - frame;
  const fadeOut =
    fadeOutFrames <= 0 ? 1 : Math.min(1, remaining / fadeOutFrames);
  return volume * Math.max(0, fadeIn) * Math.max(0, fadeOut);
};
