# AGENTS.md — kit de vídeos animados em Remotion

Este projeto produz vídeos animados em código com Remotion 4.0.524. Leia este arquivo inteiro
antes de criar ou editar qualquer cena. As skills oficiais do Remotion estão em `.agents/skills`
(seção 13) e complementam estas regras; em caso de conflito, este arquivo vence.

## 1. Comandos

| comando | faz |
| --- | --- |
| `npm run dev` | abre o Remotion Studio (`http://localhost:3000`) |
| `npm run render -- <CompId>` | renderiza `out/<CompId>.mp4` |
| `npm run still -- <CompId> out/x.png --frame=30 --scale=0.25` | um frame para conferência |
| `npm run lint` | eslint + tsc |
| `npm test` | testes unitários das funções puras (`node --test`) |
| `npm run smoke` | still de todas as compositions em `out/smoke/` |
| `npm run new-video -- <slug> --title "Título"` | cria um vídeo novo (seção 4) |
| `npm run voiceover -- <slug>` | gera narração a partir de `public/<slug>/voiceover/roteiro.json` |
| `npm run transcribe -- public/<slug>/voiceover` | gera legendas (JSON) ao lado de cada áudio |
| `npm run format` | prettier em `src` e `scripts` |
| `npm run skills:update` | atualiza as skills oficiais |

Antes de encerrar qualquer tarefa: `npm run lint && npm test`, e um still da composition alterada.

## 2. Estrutura

```
src/
  Root.tsx              registra os vídeos; tem o marcador usado por new-video
  theme/fonts.ts        fontFamily (Inter) e displayFontFamily (Poppins)
  theme/colors.ts       paleta padrão (defaults da biblioteca)
  lib/layout/           SafeArea, useFormat, funções puras de formato
  lib/media/            Captions, CaptionPage, BackgroundMusic
  lib/charts/           BarChart, LineChart, Counter
  videos/<slug>/        index.tsx (compositions), schema.ts, scenes/*.tsx
public/<slug>/          assets do vídeo, referenciados com staticFile("<slug>/...")
scripts/                new-video, voiceover, transcribe, smoke
```

Um vídeo nunca importa de outro vídeo. `src/lib` só recebe o que é dirigido por dados
(gráficos, legendas) ou infraestrutura (áudio, layout). Não crie componentes genéricos de
animação (`<FadeIn>`, `<SlideUp>`): esses padrões são receitas de copiar e colar (seção 8),
porque só markup inline é editável no Studio.

## 3. Idioma e estilo

Código e identificadores em inglês. Comentários, textos dos vídeos, nomes (`name`) dos
elementos e mensagens de console em português. Prettier do projeto (2 espaços, aspas duplas).

## 4. Como criar um vídeo novo

1. `npm run new-video -- meu-video --title "Meu vídeo"` cria `src/videos/meu-video/`
   (Intro e Outro, três formatos, schema zod) e `public/meu-video/voiceover/roteiro.json`,
   e registra o vídeo no `Root.tsx`.
2. Escreva as cenas em `scenes/` seguindo a seção 6. Uma ideia por cena.
3. Encadeie as cenas em `index.tsx` com `<TransitionSeries>`; ajuste `durationInFrames`
   literal de cada cena e o total (soma das cenas menos as transições).
4. Narração: edite o `roteiro.json`, rode `npm run voiceover -- meu-video` (voz do macOS por
   padrão; ElevenLabs com `ELEVENLABS_API_KEY` no `.env`) e depois
   `npm run transcribe -- public/meu-video/voiceover`. Adicione em cada cena
   `<Audio>` e `<Captions>` (seção 9). Use os frames impressos pelo voiceover para dimensionar
   as cenas: `durationInFrames` de cada cena deve ser pelo menos a narração mais 15 frames.
5. Confira no Studio (`npm run dev`, `http://localhost:3000/MeuVideo-Vertical`) e com stills.
6. `npm run lint && npm test`, depois renderize.

## 5. Formatos, área segura e texto

| id | dimensões | uso |
| --- | --- | --- |
| vertical | 1080x1920 | Reels, TikTok, Shorts, Stories |
| horizontal | 1920x1080 | YouTube, apresentações |
| square | 1080x1080 | feed do Instagram e LinkedIn |

fps é sempre 30. Cada vídeo registra uma `<Composition>` por formato dentro de
`<Folder name="MeuVideo">`, com `width`, `height`, `fps`, `durationInFrames` e `defaultProps`
escritos literalmente (nada de constantes nem spread). As cenas também são registradas sozinhas em
`<Folder name="Cenas">` para edição isolada.

Toda cena envolve o conteúdo em `<SafeArea>`: ele aplica a margem segura (80px laterais e 100px
vertical em 1080 de largura, escalados) e define `fontSize` base igual a 4,1% da largura
(44px em 1080). Escreva tamanhos de texto em `em`: `"2em"` ou mais para títulos (88px+),
`"1em"` para texto de apoio (44px). Nunca fontes menores que `"0.8em"`.

Para trocar o layout por formato use `useFormat()` (`isVertical`, `isHorizontal`, `isSquare`),
só em propriedades de layout (`flexDirection`, dimensões de gráfico). Tudo o mais fica literal.

## 6. Regras de markup (checklist)

- [ ] Animações usam `useCurrentFrame()` + `interpolate()`. Nunca CSS `transition`/`animation`.
- [ ] `interpolate()` fica inline dentro do `style`. Input range com números, `fps`,
      `durationInFrames`, `width`, `height` (ex.: `[0, 0.5 * fps]`, `[durationInFrames - 15, durationInFrames - 1]`).
      Output range, `easing`, `extrapolateLeft/Right: "clamp"` e `output` são literais.
- [ ] Elementos de cena são `Interactive.Div`, `Interactive.H1`, `Interactive.H2`, `Interactive.P`,
      `Interactive.Span` etc., cada um com `name` descritivo e fixo em português.
      `AbsoluteFill`, `Img`, `Video` e `Audio` já são interativos e também aceitam `name`.
- [ ] Estilos são objetos literais: sem spread, sem `useMemo`, sem constantes. Exceção: `fontFamily`
      e `displayFontFamily` importados de `src/theme/fonts`. Cores: copie o hex da seção 7.
- [ ] Transformações com as propriedades `scale`, `translate`, `rotate`. Nunca `transform`.
      `scale` animado usa `output: "perceptual-scale"`.
- [ ] Texto fixo fica inline no JSX. Texto dinâmico vem de props tipadas (`type Props = {...}`).
- [ ] Vídeo com várias cenas: um arquivo por cena em `scenes/`, encadeadas com `<TransitionSeries>`.
- [ ] `<Composition>`: metadados e `defaultProps` literais, sem `as`. `calculateMetadata` só para
      o que é realmente dinâmico (duração de um vídeo importado, dados de uma API).
- [ ] Layout de vídeo, não de página: uma ideia por cena, área segura, texto grande, nada redundante.

## 7. Tema

| token | hex | uso |
| --- | --- | --- |
| background | `#0B1020` | fundo das cenas |
| surface | `#161D33` | cartões e blocos |
| primary | `#4F7DFF` | barras, destaques frios |
| accent | `#22D3A5` | botões, palavra ativa da legenda, destaques |
| text | `#F5F7FA` | texto principal |
| muted | `#9AA4B8` | texto secundário |
| highlight | `#FFD166` | marcações, alertas |

Nas cenas, escreva o hex literalmente (`backgroundColor: "#0B1020"`). Os componentes de `src/lib`
importam `colors` de `src/theme/colors` como default. Fontes: `fontFamily` (Inter, corpo) e
`displayFontFamily` (Poppins, títulos e legendas), importadas de `src/theme/fonts`.

## 8. Cookbook de animações

Todas as receitas assumem `const frame = useCurrentFrame();` e
`const { fps, durationInFrames } = useVideoConfig();` no topo da cena.

Fade-in:

```tsx
opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
}),
```

Slide-up (entra de baixo):

```tsx
translate: interpolate(frame, [0, 0.8 * fps], ["0px 60px", "0px 0px"], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
}),
```

Pop com mola (suave: `damping: 200`; com quique: `damping: 20`):

```tsx
scale: interpolate(frame, [0, 1 * fps], [0.7, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.spring({ damping: 200 }),
  output: "perceptual-scale",
}),
```

Saída no fim da cena:

```tsx
opacity: interpolate(frame, [durationInFrames - 15, durationInFrames - 1], [1, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
}),
```

Lista com stagger (use `from` em cada item, com valores literais; o primeiro item não precisa de `from`):

```tsx
<Interactive.Div name="Item 1" style={{ opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Rápido</Interactive.Div>
<Interactive.Div name="Item 2" from={6} style={{ opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Simples</Interactive.Div>
<Interactive.Div name="Item 3" from={12} style={{ opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Editável</Interactive.Div>
```

Typewriter (11 é o número de caracteres do texto):

```tsx
<Interactive.P name="Digitando" style={{ fontFamily: "monospace", fontSize: "1em" }}>
  {"npm run dev".slice(0, Math.round(interpolate(frame, [0, 1 * fps], [0, 11], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })))}
</Interactive.P>
```

Contador (componente de dados, não editável no Modo Visual):

```tsx
<Counter to={1250} durationInFrames={45} suffix=" clientes" style={{ fontSize: "2.4em", fontWeight: 800 }} />
```

Transições entre cenas (`fade`, `slide`, `wipe`, `flip`, `clockWipe` de `@remotion/transitions/<nome>`):

```tsx
<TransitionSeries>
  <TransitionSeries.Sequence name="Intro" durationInFrames={120}>
    <Intro />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 15 })} />
  <TransitionSeries.Sequence name="Outro" durationInFrames={120}>
    <Outro />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

Duração total = soma das cenas menos a soma das transições (120 + 120 - 15 = 225).

Efeito sonoro numa transição (URLs em `@remotion/sfx`: `whoosh`, `whip`, `ding`, `pageTurn`...),
com `<Audio>` de `@remotion/media`, começando no primeiro frame da transição:

```tsx
<Audio name="Whoosh" src={whoosh} from={105} durationInFrames={30} volume={0.5} />
```

Fundo animado: um `Interactive.Div` com `filter: "blur(90px)"` e um `<Circle radius={width * 0.32} fill="#22D3A5" />`
de `@remotion/shapes`, com `translate` animado (ver `src/videos/exemplo/scenes/Intro.tsx`).

## 9. Áudio

Narração e legendas, por cena (os arquivos vêm de `npm run voiceover` e `npm run transcribe`):

```tsx
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { Captions } from "../../../lib/media/Captions";

<Audio name="Narração" src={staticFile("meu-video/voiceover/intro.mp3")} />
<Captions src={staticFile("meu-video/voiceover/intro.json")} />
```

Nas cenas com legenda, passe `captionSpace` ao `<SafeArea>` (`<SafeArea captionSpace style={{...}}>`):
ele reserva os 20% de baixo do quadro, onde a legenda aparece.

`<Captions>` aceita `switchEveryMs` (padrão 1200; menor = menos palavras por página),
`highlightColor` (padrão accent) e `position` (`"bottom"` ou `"center"`). Se o JSON não existir,
o Studio mostra uma faixa vermelha e o render falha de propósito.

`roteiro.json` (uma entrada por cena, chaves em kebab-case):

```json
{ "voice": "Luciana", "scenes": { "intro": "Texto da abertura.", "outro": "Texto do fim." } }
```

A transcrição usa Whisper.cpp local (modelo `medium`, português), configurado em
`scripts/whisper-config.ts`. Se uma palavra sair errada, corrija só o campo `text` no JSON.

Trilha em loop com fades: `<BackgroundMusic src={staticFile("meu-video/music/trilha.mp3")} volume={0.2} />`
(o projeto não inclui trilhas; coloque um arquivo com licença em `public/<slug>/music/`).

Vídeo e imagens importados: `<Video>` de `@remotion/media` e `<CanvasImage>` de `remotion`,
sempre via `staticFile("<slug>/...")`. Detalhes em `.agents/skills/remotion-markup/`.

Duração dinâmica pela narração (avançado): `.agents/skills/remotion-markup/voiceover.md` e
`calculate-metadata.md`.

## 10. Gráficos e dados

| componente | props principais |
| --- | --- |
| `<BarChart>` | `data: {label, value}[]`, `width`, `height`, `color?`, `labelColor?`, `enterDurationInFrames?` (30), `staggerFrames?` (4), `formatValue?` |
| `<LineChart>` | `data`, `width`, `height`, `color?`, `strokeWidth?` (8), `showDots?`, `showArea?`, `enterDurationInFrames?` (45) |
| `<Counter>` | `to`, `from?`, `durationInFrames?` (45), `decimals?`, `prefix?`, `suffix?`, `locale?` ("pt-BR"), `style?` |

Dados entram por props da composition, validados com zod em `schema.ts` (`zColor()` de
`@remotion/zod-types` para cores). Assim ficam editáveis no painel de props do Studio.
Referência completa: `src/videos/exemplo/scenes/Dados.tsx`.

## 11. Render

`npm run render -- Exemplo-Vertical` gera `out/Exemplo-Vertical.mp4` (H.264 + AAC).
Opções (`--codec`, `--scale`, `--frames`, `--props`): `.agents/skills/remotion-render/SKILL.md`.
A primeira renderização baixa o Chrome Headless Shell.

## 12. Verificação

1. `npm run lint` e `npm test` sem erros.
2. Still da composition alterada: `npm run still -- MeuVideo-Vertical out/check/x.png --frame=30 --scale=0.25`, e olhe a imagem.
3. `npm run smoke` antes de entregar.
4. Render completo quando houver áudio ou legendas.

## 13. Skills oficiais (`.agents/skills`)

| situação | skill |
| --- | --- |
| dúvida geral, roteamento | `remotion-best-practices/SKILL.md` |
| escrever ou revisar markup | `remotion-markup/SKILL.md` (+ `timing.md`, `transitions.md`, `sequencing.md`) |
| manter tudo editável no Studio | `remotion-interactivity/SKILL.md` |
| legendas | `remotion-captions/SKILL.md` |
| renderizar com opções | `remotion-render/SKILL.md` |
| abrir o Studio numa composition | `remotion-studio/SKILL.md` |
| procurar uma API na documentação | `remotion-docs/SKILL.md` |
| mapas, multimídia, SaaS | `remotion-maps`, `remotion-multimedia`, `remotion-saas` |
| atualizar o Remotion | `remotion-upgrade/SKILL.md` |

## 14. Deploy no VPS (Coolify)

Guia completo em [docs/deploy-coolify.md](docs/deploy-coolify.md). Resumo:

- `Dockerfile` único; `SERVICE=studio` sobe o Studio com senha (Caddy, `STUDIO_USER`/`STUDIO_PASSWORD`),
  `SERVICE=api` sobe a API de render (`server/index.ts`, `RENDER_API_KEY`, mp4 em `/app/renders`).
- API: `POST /renders` (`compositionId`, `inputProps?`), `GET /renders/:id`, `GET /renders/:id/download`,
  `DELETE /renders/:id`, `GET /compositions`, `GET /health`. Fila serial, limpeza por `RENDER_TTL_HOURS`.
- Localmente: `RENDER_API_KEY=teste npm run api` (faz o bundle na hora) ou `docker build -t videos:local .`.
- Funções puras da API (`server/validate.ts`, `auth.ts`, `retention.ts`) têm testes; a fila e as rotas
  são verificadas com um render real via `curl`.
