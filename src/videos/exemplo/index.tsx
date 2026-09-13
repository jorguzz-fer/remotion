import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Composition, Folder } from "remotion";
import type { z } from "zod";
import { Dados } from "./scenes/Dados";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { exemploSchema } from "./schema";

type ExemploProps = z.infer<typeof exemploSchema>;

// Duração total: Intro 120 + Dados 240 + Outro 120 = 480 frames,
// menos duas transições de 15 frames = 450 frames (15 s a 30 fps).
export const Exemplo: React.FC<ExemploProps> = ({
  title,
  subtitle,
  cta,
  accentColor,
  data,
}) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Intro" durationInFrames={120}>
        <Intro title={title} subtitle={subtitle} accentColor={accentColor} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Dados" durationInFrames={240}>
        <Dados accentColor={accentColor} data={data} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Outro" durationInFrames={120}>
        <Outro cta={cta} accentColor={accentColor} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

// Uma composition por formato (mesmo componente, mesmos defaultProps, dimensões diferentes)
// e cada cena registrada sozinha em "Cenas" para edição isolada no Studio.
export const ExemploCompositions: React.FC = () => {
  return (
    <Folder name="Exemplo">
      <Composition
        id="Exemplo-Vertical"
        component={Exemplo}
        schema={exemploSchema}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={450}
        defaultProps={{
          title: "Vídeos em código",
          subtitle:
            "Motion graphics com React e Remotion, editáveis no Studio.",
          cta: "Comece hoje",
          accentColor: "#22D3A5",
          data: [
            { label: "Jan", value: 12 },
            { label: "Fev", value: 18 },
            { label: "Mar", value: 25 },
            { label: "Abr", value: 31 },
            { label: "Mai", value: 44 },
          ],
        }}
      />
      <Composition
        id="Exemplo-Horizontal"
        component={Exemplo}
        schema={exemploSchema}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={450}
        defaultProps={{
          title: "Vídeos em código",
          subtitle:
            "Motion graphics com React e Remotion, editáveis no Studio.",
          cta: "Comece hoje",
          accentColor: "#22D3A5",
          data: [
            { label: "Jan", value: 12 },
            { label: "Fev", value: 18 },
            { label: "Mar", value: 25 },
            { label: "Abr", value: 31 },
            { label: "Mai", value: 44 },
          ],
        }}
      />
      <Composition
        id="Exemplo-Square"
        component={Exemplo}
        schema={exemploSchema}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={450}
        defaultProps={{
          title: "Vídeos em código",
          subtitle:
            "Motion graphics com React e Remotion, editáveis no Studio.",
          cta: "Comece hoje",
          accentColor: "#22D3A5",
          data: [
            { label: "Jan", value: 12 },
            { label: "Fev", value: 18 },
            { label: "Mar", value: 25 },
            { label: "Abr", value: 31 },
            { label: "Mai", value: 44 },
          ],
        }}
      />
      <Folder name="Cenas">
        <Composition
          id="Exemplo-Intro"
          component={Intro}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={120}
          defaultProps={{
            title: "Vídeos em código",
            subtitle:
              "Motion graphics com React e Remotion, editáveis no Studio.",
            accentColor: "#22D3A5",
          }}
        />
        <Composition
          id="Exemplo-Dados"
          component={Dados}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={240}
          defaultProps={{
            accentColor: "#22D3A5",
            data: [
              { label: "Jan", value: 12 },
              { label: "Fev", value: 18 },
              { label: "Mar", value: 25 },
              { label: "Abr", value: 31 },
              { label: "Mai", value: 44 },
            ],
          }}
        />
        <Composition
          id="Exemplo-Outro"
          component={Outro}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={120}
          defaultProps={{ cta: "Comece hoje", accentColor: "#22D3A5" }}
        />
      </Folder>
    </Folder>
  );
};
