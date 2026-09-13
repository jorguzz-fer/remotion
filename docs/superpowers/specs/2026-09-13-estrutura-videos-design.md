# Estrutura do projeto `videos` (Remotion) — design

Data: 2026-09-13
Status: aprovado em conversa, aguardando revisão do texto

## 1. Contexto e objetivo

Queremos uma base em Remotion para produzir vídeos animados em código, com a maior parte
do trabalho feita em conversa com um agente (Claude Code) e ajustes finos no Remotion Studio.
O código-fonte do Remotion 4.0.524 foi baixado em `../remotion-main` e serve apenas como
referência de APIs e documentação. O projeto de vídeos é independente dele.

Objetivo desta entrega: um projeto Remotion pronto, com convenções documentadas,
biblioteca mínima para o que é dirigido por dados, scripts para narração e legendas,
e um vídeo de exemplo que exercita tudo nos três formatos.

## 2. Decisões já tomadas

| Tema | Decisão |
| --- | --- |
| Local | `/Users/fernandojorge/Desktop/Projetos/apps/Remotion/videos`, pasta irmã de `remotion-main` |
| Versão | Remotion 4.0.524 (mesma do código-fonte baixado e última publicada no npm) |
| Gerenciador de pacotes | npm (lockfile `package-lock.json`) |
| Formatos | vertical 1080x1920, horizontal 1920x1080, quadrado 1080x1080, todos a 30 fps |
| Conteúdo | motion graphics com texto e formas; narração e legendas; vídeo, imagens e áudio importados; dados e gráficos animados |
| Estilo | sem Tailwind; estilos inline para manter o Modo Visual do Studio funcionando |
| Idioma | código e identificadores em inglês; documentação, comentários e textos dos vídeos em português (pt-BR) |
| Abordagem | projeto único ("kit de vídeos"), sem monorepo, sem partir de template opinado |

## 3. Estrutura de pastas

```
videos/
├── AGENTS.md                    # convenções do projeto + cookbook de animações
├── CLAUDE.md                    # aponta para AGENTS.md
├── README.md                    # como rodar, em 10 linhas
├── .agents/skills/              # skills oficiais do Remotion (npx remotion skills add)
├── .claude/skills -> ../.agents/skills   # symlink criado pelo instalador de skills
├── docs/superpowers/specs/      # este documento e o plano de implementação
├── public/
│   └── exemplo/                 # assets do vídeo "exemplo"
│       └── voiceover/           # roteiro.json, intro/dados/outro.mp3 e os .json de legendas ao lado
├── scripts/
│   ├── new-video.ts            # cria src/videos/<slug>/ e registra no Root.tsx
│   ├── voiceover.ts            # gera narração (macOS `say` por padrão, ElevenLabs opcional)
│   ├── transcribe.ts           # Whisper.cpp local -> JSON de legendas
│   ├── whisper-config.ts       # versão, modelo e idioma do Whisper
│   ├── smoke.ts                # renderiza um still de cada composition (verificação)
│   ├── lib/                     # funções puras dos scripts (slug, template, roteiro...) com testes
│   └── templates/video/         # esqueleto usado pelo new-video (arquivos .tmpl)
├── src/
│   ├── index.ts                 # registerRoot
│   ├── Root.tsx                 # importa e renderiza os vídeos; contém o marcador do new-video
│   ├── theme/
│   │   ├── fonts.ts             # Google Fonts carregadas uma vez
│   │   └── colors.ts            # paleta padrão (defaults da biblioteca)
│   ├── lib/
│   │   ├── layout/format.ts          # funções puras (getFormat, getSafeAreaMetrics) + format.test.ts
│   │   ├── layout/useFormat.ts
│   │   ├── layout/SafeArea.tsx
│   │   ├── media/fade-volume.ts      # função pura + teste
│   │   ├── media/BackgroundMusic.tsx
│   │   ├── media/caption-pages.ts    # função pura + teste
│   │   ├── media/CaptionPage.tsx
│   │   ├── media/Captions.tsx
│   │   ├── charts/chart-geometry.ts  # funções puras + teste
│   │   ├── charts/format-number.ts   # função pura + teste
│   │   ├── charts/Counter.tsx
│   │   ├── charts/BarChart.tsx
│   │   └── charts/LineChart.tsx
│   └── videos/
│       └── exemplo/
│           ├── index.tsx        # compositions (3 formatos + cenas) e componente principal
│           ├── schema.ts        # zod schema das props
│           └── scenes/          # Intro.tsx, Dados.tsx, Outro.tsx
├── remotion.config.ts
├── .env.example                 # ELEVENLABS_API_KEY=
├── .gitignore                   # node_modules, out, .env, whisper.cpp, temp, .DS_Store
├── eslint.config.mjs, tsconfig.json, .prettierrc
└── package.json
```

Responsabilidades:

- `src/videos/<slug>/`: tudo que é específico de um vídeo. Um vídeo nunca importa de outro vídeo.
- `src/lib/`: só o que é dirigido por dados (gráficos, legendas) ou infraestrutura (áudio, layout).
  Nada de componentes genéricos de animação como `<FadeIn>`; esses padrões vivem como receitas no AGENTS.md.
- `src/theme/`: fontes e paleta. A paleta é usada como default pelos componentes da biblioteca.
  As cenas escrevem cores como literais, copiadas da tabela do AGENTS.md.
- `public/<slug>/`: assets do vídeo, referenciados com `staticFile("<slug>/...")`.
- `scripts/`: automações de linha de comando, em TypeScript executado direto pelo Node 26 (sem build).

## 4. Convenções de markup

Estas regras vêm das skills oficiais `remotion-markup` e `remotion-interactivity` e valem para toda cena:

1. Animações usam `useCurrentFrame()` e `interpolate()`. Nunca CSS `transition` ou `animation`.
2. O `interpolate()` fica inline na propriedade do `style`. Input range pode usar `fps`, `durationInFrames`,
   `width` e `height` vindos de `useVideoConfig()`. Output range, easing e extrapolação são literais.
3. Elementos de cena são `Interactive.Div`, `Interactive.Span` etc., com `name` descritivo e fixo.
   `AbsoluteFill`, `Img`, `Video` e `Audio` já são interativos.
4. Estilos são objetos literais: sem spread, sem constantes, sem `useMemo`. Exceção: `fontFamily`
   vindo de `src/theme/fonts.ts`, que é o padrão recomendado pela skill de fontes.
5. Transformações usam as propriedades CSS `scale`, `translate` e `rotate`, nunca `transform`.
   Animações de `scale` usam `output: "perceptual-scale"`.
6. Texto fixo fica inline no JSX. Texto dinâmico vem de props.
7. Em `<Composition>`, `width`, `height`, `fps`, `durationInFrames` e `defaultProps` são literais inline,
   sem type assertion. `calculateMetadata` só quando algo é realmente dinâmico.
8. Vídeos com mais de uma cena usam `<TransitionSeries>` com um arquivo por cena.
   `durationInFrames` de cada cena é literal, escrito como `4 * fps` ou número.
9. Cada vídeo registra uma composition por formato dentro de `<Folder name="<Slug>">`, e cada cena
   também é registrada sozinha em `<Folder name="Cenas">` aninhada, para edição isolada no Studio.
10. Layout de vídeo, não de página: uma ideia por cena, área segura respeitada, texto grande.

## 5. Formatos e layout

| id | dimensões | uso típico |
| --- | --- | --- |
| `vertical` | 1080x1920 | Reels, TikTok, Shorts, Stories |
| `horizontal` | 1920x1080 | YouTube, apresentações |
| `square` | 1080x1080 | feed do Instagram e LinkedIn |

fps é sempre 30. Os presets são documentação: os valores aparecem literalmente em cada `<Composition>`.

`useFormat()` (em `src/lib/layout/useFormat.ts`) lê `useVideoConfig()` e retorna
`{format, width, height, isVertical, isHorizontal, isSquare}`. Regra: altura maior que largura é
`vertical`, largura maior é `horizontal`, iguais é `square`. As cenas usam isso para trocar
direção de layout, tamanho de fonte e posição.

`<SafeArea>` é um `AbsoluteFill` com padding proporcional à largura: 80px laterais e 100px
em cima e embaixo para 1080 de largura, escalados linearmente pela largura real
(1920 de largura dá 142px e 178px). Aceita `style` para sobrescrever alinhamento e `name` para o Studio.

`<SafeArea>` também define `fontSize` igual a 4,1% da largura (44px em 1080, 79px em 1920).
As cenas escrevem tamanhos de texto em `em`, como literais: `"2em"` para títulos (88px em 1080)
e `"1em"` para texto de apoio (44px). Isso cumpre os mínimos de 84px e 44px da skill de layout
e escala sozinho nos três formatos, sem condicionais no `style`.

## 6. Tema

- `fonts.ts`: carrega `Inter` (pesos 400, 600, 800, subset latin) como `fontFamily` e
  `Poppins` (pesos 600, 800, subset latin) como `displayFontFamily`, via `@remotion/google-fonts`.
  O carregamento bloqueia o render até a fonte estar pronta, sem código extra.
- `colors.ts`: paleta padrão, exportada como objeto com as chaves
  `background`, `surface`, `primary`, `accent`, `text`, `muted`, `highlight`.
  Os valores iniciais são um tema escuro azul com destaque verde-água; a tabela exata fica no AGENTS.md.
  Só a biblioteca importa este arquivo. Cenas usam literais.

## 7. Biblioteca (`src/lib`)

Cada componente tem uma responsabilidade, recebe dados por props e não depende de outro vídeo.

### `layout/SafeArea.tsx` e `layout/useFormat.ts`

Descritos na seção 5.

### `media/BackgroundMusic.tsx`

Envolve `<Audio>` de `@remotion/media` com loop e fades.
Props: `src` (obrigatório), `volume` (0 a 1, padrão 0.25), `fadeInSeconds` (padrão 1),
`fadeOutSeconds` (padrão 2). O fade-out usa `durationInFrames` da composition para terminar no fim.
Não é usado pelo vídeo de exemplo porque o projeto não tem trilha com licença; fica coberto por lint, tsc
e pelo teste unitário da curva de volume (`fade-volume.test.ts`).

### `media/Captions.tsx` e `media/CaptionPage.tsx`

Exibe legendas estilo TikTok a partir de um JSON no formato `Caption[]` de `@remotion/captions`.
Props: `src` (URL do JSON, normalmente `staticFile(...)`), `switchEveryMs` (padrão 1200),
`highlightColor` (padrão `colors.accent`), `position` (`"bottom"` padrão ou `"center"`).

Comportamento:

- Carrega o JSON com `fetch` segurando o render com `useDelayRender`; em Studio, observa o arquivo
  com `watchStaticFile` e recarrega quando o script de transcrição o reescreve.
- Agrupa com `createTikTokStyleCaptions` e renderiza uma `<Sequence>` por página, com
  `CaptionPage` destacando a palavra falada. `whiteSpace: "pre"` preserva os espaços.
- Tamanho da fonte padrão: 5,5% da largura da composition, fonte `displayFontFamily`, com `textShadow`
  preto em quatro direções para legibilidade sobre qualquer fundo.
- Arquivo ausente: no Studio, mostra uma faixa vermelha com o caminho esperado, sem quebrar a
  pré-visualização. Durante render (`getRemotionEnvironment().isRendering`), chama `cancelRender`
  com erro explícito. Nunca renderiza um vídeo sem legendas em silêncio.

### `charts/BarChart.tsx`

SVG com barras verticais que crescem do zero até o valor.
Props: `data` (`{label: string; value: number}[]`), `width`, `height`, `color` (padrão `colors.primary`),
`labelColor` (padrão `colors.text`), `enterDurationInFrames` (padrão 30), `staggerFrames` (padrão 4),
`formatValue` (função opcional; padrão `Intl.NumberFormat("pt-BR")`). Mostra o valor acima de cada barra
quando a barra passa de 90% da altura final.

### `charts/LineChart.tsx`

SVG com linha revelada progressivamente (`strokeDasharray` com `pathLength`), pontos e área opcional.
Props: `data` (`{label: string; value: number}[]`), `width`, `height`, `color`, `strokeWidth` (padrão 8),
`showDots` (padrão true), `showArea` (padrão true), `enterDurationInFrames` (padrão 45).

### `charts/Counter.tsx`

Número animado de `from` até `to`.
Props: `to` (obrigatório), `from` (padrão 0), `durationInFrames` (padrão 45), `decimals` (padrão 0),
`prefix`, `suffix`, `locale` (padrão `"pt-BR"`), `style` repassado ao `span`.
Usa easing `Easing.out(Easing.cubic)` e `Intl.NumberFormat`.

Gráficos e contador não são editáveis no Modo Visual (são dirigidos por dados); ajustam-se por props.

## 8. Scripts

Todos em `scripts/*.ts`, rodados com `node` (Node 26 executa TypeScript sem build). O `package.json`
declara `"type": "module"`, então scripts e testes são ESM e importam módulos locais com a extensão `.ts` explícita.
Expostos no `package.json`:

| comando | faz |
| --- | --- |
| `npm run dev` | `remotion studio` |
| `npm run render -- <CompId>` | `remotion render`, saída em `out/<CompId>.mp4` |
| `npm run still -- <CompId>` | `remotion still` |
| `npm run lint` | `eslint src scripts` e `tsc` |
| `npm test` | `node --test` nos arquivos `*.test.ts` de `src/` e `scripts/` |
| `npm run format` | `prettier --write src scripts` |
| `npm run smoke` | still de todas as compositions em `out/smoke/` |
| `npm run new-video -- <slug>` | cria um vídeo novo |
| `npm run voiceover -- <slug>` | gera narração a partir do roteiro |
| `npm run transcribe -- <caminho...>` | gera legendas |
| `npm run skills:update` | `remotion skills update` |
| `npm run upgrade` | `remotion upgrade` |

### `new-video.ts <slug>`

- Valida o slug (kebab-case, só letras minúsculas, números e hífens). Recusa se `src/videos/<slug>` existir.
- Copia `scripts/templates/video/*.tmpl` substituindo `__slug__` (kebab), `__Slug__` (PascalCase) e
  `__Titulo__` (opção `--title`, padrão igual ao slug). Gera `index.tsx` com as três compositions e a
  pasta `Cenas`, `schema.ts`, `scenes/Intro.tsx` e `scenes/Outro.tsx`, e `public/<slug>/voiceover/roteiro.json`
  com uma entrada por cena e texto de exemplo.
- Insere o import e o JSX no `src/Root.tsx` acima do marcador
  `{/* new-video: registre vídeos acima desta linha */}`. Se o marcador não existir, imprime as duas linhas
  para inserir manualmente e sai com código 0.
- Termina imprimindo a URL do Studio para a composition vertical do vídeo novo.

### `voiceover.ts <slug> [--provider macos|elevenlabs] [--voice <nome>]`

- Lê `public/<slug>/voiceover/roteiro.json` com o formato
  `{"voice": "Luciana", "scenes": {"intro": "texto...", "dados": "texto..."}}`.
- Provider `macos` (padrão): roda `say -v <voice> -o temp/<cena>.wav --file-format=WAVE --data-format=LEI16@22050`
  e converte para mp3 com o ffmpeg do Remotion (que não lê o AIFF-C padrão do `say`). Sem custo, sem chave,
  só funciona no macOS.
- Provider `elevenlabs` (usado automaticamente se `ELEVENLABS_API_KEY` estiver definido e o provider
  não for forçado): chama `POST /v1/text-to-speech/<voiceId>` com `eleven_multilingual_v2` e grava o mp3.
  O `voice` no roteiro passa a ser o voiceId. A chave vem de `.env` via `node --env-file-if-exists=.env`.
- Escreve `public/<slug>/voiceover/<cena>.mp3`. Sobrescreve sem perguntar.
- Imprime a duração em segundos e em frames (a 30 fps) de cada mp3 gerado, lida com
  `npx remotion ffprobe`, para ajustar `durationInFrames` das cenas.

### `transcribe.ts <arquivo ou pasta...> [--force]`

- Aceita `.mp3`, `.wav`, `.m4a`, `.mp4`, `.mov`, `.webm`, `.mkv`, dentro de `public/`. Pastas são
  percorridas recursivamente.
- Pula arquivos que já têm `.json` ao lado, a menos que `--force`.
- Instala Whisper.cpp em `./whisper.cpp` (gitignored) e baixa o modelo na primeira execução.
- Converte para wav 16 kHz em `temp/` com `npx remotion ffmpeg`, roda `transcribe()` com
  `language` e `model` do `whisper-config.ts`, `tokenLevelTimestamps: true`, `splitOnWord: true`,
  aplica `toCaptions()` e grava `<mesmo nome>.json` ao lado do arquivo de origem. Apaga `temp/` ao final.
- `whisper-config.ts`: `WHISPER_VERSION = "1.6.0"`, `WHISPER_MODEL = "medium"` (multilíngue, 1,5 GB),
  `WHISPER_LANG = "pt"`. A 1.6.0 é a versão do template oficial e compila só com `git` e `make`,
  que existem nesta máquina. Versões 1.7.4 ou mais novas exigem `cmake`, que não está instalado.
  O comentário do arquivo lista as alternativas: `small` para testes rápidos, e `large-v3-turbo`
  para mais qualidade, que exige Whisper.cpp 1.7.2 ou mais novo.

### `smoke.ts`

Usa `@remotion/bundler` e `@remotion/renderer`: faz o bundle uma vez, lista as compositions com
`getCompositions` e renderiza o frame do meio de cada uma em `out/smoke/<id>.png` com `scale: 0.25`.
Falha com código 1 se qualquer composition lançar erro. É o teste de fumaça do projeto.

## 9. Vídeo de exemplo (`src/videos/exemplo`)

Serve de referência viva das convenções e de teste da estrutura.

- `schema.ts`: `z.object({title, subtitle, cta: z.string(), accentColor: zColor(),
  data: z.array(z.object({label: z.string(), value: z.number()}))})`.
- `index.tsx`: componente `Exemplo` com `<TransitionSeries>` de três cenas e `<Folder name="Exemplo">`
  com `Exemplo-Vertical`, `Exemplo-Horizontal`, `Exemplo-Square` (mesmo componente, mesmos `defaultProps`
  inline, dimensões diferentes) e `<Folder name="Cenas">` com `Exemplo-Intro`, `Exemplo-Dados`, `Exemplo-Outro`.
- Durações iniciais: Intro 4 s, Dados 8 s, Outro 4 s, com duas transições de 15 frames
  (`fade()` e `slide({direction: "from-right"})`, `linearTiming`). Total: 480 - 30 = 450 frames.
  Se uma narração gerada ficar mais longa que a cena, a duração da cena é aumentada para caber com
  folga de pelo menos 15 frames, e o total é recalculado. Os valores finais ficam literais no código.
- Cenas:
  - `Intro`: fundo sólido, um `Circle` de `@remotion/shapes` desfocado deslizando devagar, título com
    `scale` e `opacity` por spring, subtítulo entrando por `translate`. Narração `intro.mp3` e `<Captions>`.
  - `Dados`: título curto, `<BarChart>` com os cinco valores de `data` vindos dos `defaultProps`
    (editáveis no painel de props do Studio), `<Counter>` com a soma deles. Narração `dados.mp3`.
  - `Outro`: chamada para ação com um "botão" `Interactive.Div` que entra por spring, texto de apoio.
    Narração `outro.mp3`.
  - Um whoosh em cada transição: a URL `whoosh` exportada por `@remotion/sfx`
    (`https://remotion.media/whoosh.wav`), tocada com `<Audio>` de `@remotion/media` usando
    `from` e `durationInFrames` na composição principal.
- Layout por formato: no vertical, título e gráfico empilham; no horizontal, ficam lado a lado;
  no quadrado, empilham com fontes menores. Decidido via `useFormat()`.
- Narração gerada com `npm run voiceover -- exemplo` (voz Luciana, provider macos) e legendas com
  `npm run transcribe -- public/exemplo/voiceover`. Os `.mp3` e `.json` resultantes são commitados,
  então o exemplo abre e renderiza sem instalar o Whisper.
- Sem trilha de fundo, pela falta de asset com licença.

## 10. Documentação para agentes e pessoas

- `AGENTS.md` (pt-BR) com as seções: comandos; estrutura de pastas; como criar um vídeo novo;
  formatos, área segura e tamanhos de texto; regras de markup (seção 4 deste documento);
  tema (tabela de cores e fontes); cookbook de animações; áudio (narração, legendas, trilha, sfx);
  gráficos e dados; render; verificação; quando carregar cada skill oficial.
- Cookbook: receitas curtas e completas em JSX inline para fade-in, slide-up, pop com spring,
  stagger de lista, typewriter (fatiando a string com `interpolate`), contador, saída de cena,
  `TransitionSeries` com `fade`/`slide`/`wipe`, sfx em transição e trilha com `BackgroundMusic`.
- `CLAUDE.md`: mesmo padrão do monorepo, apontando para `AGENTS.md`.
- Skills oficiais instaladas com `npx remotion skills add` (roda `npx skills add remotion-dev/skills`),
  que grava em `.agents/skills` e cria o symlink `.claude/skills`. As skills são commitadas para o
  projeto ser autossuficiente; `npm run skills:update` atualiza.
- `README.md`: instalação, `npm run dev`, render, links para `AGENTS.md`.

## 11. Configuração do projeto

- Scaffold: `npx create-video@latest --yes --blank --no-tailwind` numa pasta temporária, copiando o
  resultado (exceto qualquer `.git`) para `videos/`, porque a pasta já contém `.git` e `docs/` e o
  `create-video` recusa pastas não vazias e pastas dentro de repositórios git.
- Dependências, todas em 4.0.524 via `npx remotion add`: `remotion`, `@remotion/cli`,
  `@remotion/transitions`, `@remotion/google-fonts`, `@remotion/media`, `@remotion/captions`,
  `@remotion/shapes`, `@remotion/sfx`, `@remotion/zod-types`, `@remotion/bundler`, `@remotion/renderer`;
  `zod`; dev: `@remotion/install-whisper-cpp`, `@remotion/eslint-config-flat`, `eslint`, `prettier`,
  `typescript`, `@types/react`, `@types/web`, `@types/node`. `react` e `react-dom` nas versões do scaffold.
- `package.json` com `"type": "module"` e os scripts da seção 8.
- `tsconfig.json` do scaffold, com `target` e `lib` em ES2022, `allowImportingTsExtensions: true`
  (para os testes importarem `./x.ts`), `scripts` incluído na checagem (`include: ["src", "scripts"]`)
  e `scripts/templates` excluído.
- `remotion.config.ts` do scaffold: rspack ativo, `jpeg`, sobrescrever saída.
- `.env.example` com `ELEVENLABS_API_KEY=`.
- `.gitignore`: `node_modules`, `out`, `.env`, `whisper.cpp`, `temp`, `.DS_Store`.

## 12. Tratamento de erros

- Legenda ausente: seção 7 (`Captions`).
- Áudio ausente: `<Audio>` de `@remotion/media` já falha com erro claro; não há fallback silencioso.
- `new-video`: slug inválido ou já existente encerra com mensagem e código 1, sem tocar em nada.
- `voiceover`: roteiro ausente ou cena sem texto encerra com código 1 antes de gerar qualquer áudio;
  provider `elevenlabs` sem chave encerra com instrução de criar `.env`.
- `transcribe`: arquivo fora de `public/` ou extensão não suportada é pulado com aviso; falha do
  Whisper interrompe o script com a saída do erro.
- `smoke`: qualquer composition com erro falha o script listando o id.

## 13. Verificação e critérios de aceite

1. `npm run lint` passa sem erros.
2. `npx remotion compositions` lista exatamente `Exemplo-Vertical`, `Exemplo-Horizontal`, `Exemplo-Square`,
   `Exemplo-Intro`, `Exemplo-Dados`, `Exemplo-Outro`.
3. `npm run smoke` renderiza um still de cada composition sem erro.
4. `npm run render -- Exemplo-Vertical` gera `out/Exemplo-Vertical.mp4` de 15 s; frames extraídos
   com ffmpeg mostram legendas na cena Intro e o gráfico na cena Dados; o áudio da narração está presente
   (verificado com `ffprobe` mostrando a trilha de áudio).
5. `npm run new-video -- teste` cria um vídeo que aparece no Studio e passa `npm run lint`; a pasta e o
   registro no Root são removidos em seguida.
6. O Studio abre com `npx remotion studio --no-open` e a composition `Exemplo-Vertical` é inspecionada
   no navegador da própria sessão.
7. Voz e legendas do exemplo foram geradas pelos próprios scripts do projeto, não à mão.
8. `npm test` passa: as funções puras de layout, gráficos, legendas e scripts têm testes unitários
   (`node --test`, sem dependência extra).

## 14. Fora de escopo

Render em nuvem (Lambda, Cloud Run), `@remotion/player` e SaaS, Tailwind, CI, teste real do provider
ElevenLabs (sem chave disponível), trilha musical, testes unitários de componentes visuais.
