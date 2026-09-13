import { Audio } from "@remotion/media";
import { useVideoConfig } from "remotion";
import { fadeVolume } from "./fade-volume";

type Props = {
  src: string;
  volume?: number;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
};

// Trilha em loop pela duração toda da composition, com fade de entrada e de saída.
export const BackgroundMusic: React.FC<Props> = ({
  src,
  volume = 0.25,
  fadeInSeconds = 1,
  fadeOutSeconds = 2,
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <Audio
      name="Trilha"
      src={src}
      loop
      loopVolumeCurveBehavior="extend"
      volume={(frame) =>
        fadeVolume({
          frame,
          durationInFrames,
          fadeInFrames: fadeInSeconds * fps,
          fadeOutFrames: fadeOutSeconds * fps,
          volume,
        })
      }
    />
  );
};
