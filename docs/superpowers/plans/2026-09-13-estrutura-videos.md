# Estrutura do projeto `videos` — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o projeto Remotion `videos` com biblioteca mínima, scripts de narração/legendas/geração de vídeo, documentação para agentes e um vídeo de exemplo funcionando nos três formatos.

**Architecture:** Projeto Remotion único (npm, sem monorepo). Cenas escritas com markup inline (`Interactive.*` + `interpolate()` inline) para o Studio conseguir editar; `src/lib` só contém componentes dirigidos por dados (gráficos, legendas, áudio, layout); cada vídeo vive em `src/videos/<slug>/` e registra uma composition por formato. Scripts em TypeScript executados direto pelo Node 26.

**Tech Stack:** Remotion 4.0.524 (`remotion`, `@remotion/cli`, `transitions`, `google-fonts`, `media`, `captions`, `shapes`, `sfx`, `zod-types`, `bundler`, `renderer`, `install-whisper-cpp`), React 19, TypeScript, zod, Node 26 (`node --test`, type stripping), Whisper.cpp 1.6.0, macOS `say`.

**Spec:** `docs/superpowers/specs/2026-09-13-estrutura-videos-design.md` (leia antes de executar qualquer tarefa; as seções citadas abaixo são dele).

## Global Constraints

- Diretório do projeto: `/Users/fernandojorge/Desktop/Projetos/apps/Remotion/videos`. Todos os comandos deste plano rodam nele, salvo indicação contrária. Nunca edite nada em `../remotion-main` (é só referência).
- Versão: `remotion` e todos os `@remotion/*` em `4.0.524`. Novos pacotes Remotion entram com `npx remotion add <pacote>`, nunca com `npm i` direto.
- Gerenciador: npm. Lockfile `package-lock.json`.
- `package.json` tem `"type": "module"`. Scripts e testes são `.ts` (ESM) rodados pelo Node 26 sem build. Em scripts e testes, imports de módulos locais levam a extensão `.ts` explícita (`./lib/slug.ts`). No código de `src/` que o Remotion empacota, imports ficam sem extensão.
- Formatos: vertical 1080x1920, horizontal 1920x1080, square 1080x1080, todos a 30 fps, sempre literais em `<Composition>`.
- Regras de markup (spec §4): animações só com `useCurrentFrame()` + `interpolate()` inline no `style`; elementos de cena são `Interactive.*` com `name` fixo; estilos são objetos literais (sem spread, sem constantes, exceto `fontFamily`/`displayFontFamily` do tema); usar `scale`/`translate`/`rotate`, nunca `transform`; `scale` com `output: "perceptual-scale"`; tamanhos de texto em `em` (`"2em"` títulos, `"1em"` apoio); `width/height/fps/durationInFrames/defaultProps` literais em `<Composition>`.
- IDs de `<Composition>` e `name` de `<Folder>` só com letras, números e hífens.
- Código e identificadores em inglês; documentação, comentários, mensagens de console e textos de vídeo em pt-BR.
- Estilo: Prettier do scaffold (2 espaços, aspas duplas, `bracketSpacing`). Rode `npm run format` antes de cada commit.
- Commits: `git add` só dos arquivos da tarefa; mensagem em pt-BR com prefixo (`chore:`, `feat:`, `docs:`, `test:`); terminar com a linha `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Verificação mínima antes de cada commit: `npm run lint` (eslint + tsc) e, a partir da Task 3, `npm test`.
- Não instale nada globalmente. Não use `sudo`.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`, `remotion.config.ts`, `eslint.config.mjs`, `.prettierrc` | Configuração do projeto (Task 1) |
| `.agents/skills/*`, `.claude/skills` | Skills oficiais do Remotion (Task 2) |
| `src/index.ts`, `src/Root.tsx` | Entrada do Remotion; Root importa os vídeos e tem o marcador do `new-video` (Tasks 1 e 6) |
| `src/theme/fonts.ts` | Carrega Inter e Poppins uma vez; exporta `fontFamily`, `displayFontFamily` (Task 3) |
| `src/theme/colors.ts` | Paleta padrão usada como default pela biblioteca (Task 3) |
| `src/lib/layout/format.ts` (+ `.test.ts`) | Funções puras: `getFormat`, `getSafeAreaMetrics` (Task 3) |
| `src/lib/layout/useFormat.ts` | Hook `useFormat()` (Task 3) |
| `src/lib/layout/SafeArea.tsx` | Container com margem segura e `fontSize` base (Task 3) |
| `src/lib/charts/chart-geometry.ts` (+ `.test.ts`) | Funções puras de layout de barras e linhas (Task 4) |
| `src/lib/charts/format-number.ts` (+ `.test.ts`) | `formatNumber` pt-BR (Task 4) |
| `src/lib/charts/Counter.tsx`, `BarChart.tsx`, `LineChart.tsx` | Componentes de dados (Task 4) |
| `src/lib/media/fade-volume.ts` (+ `.test.ts`) | Curva de volume com fades (Task 5) |
| `src/lib/media/BackgroundMusic.tsx` | Trilha em loop com fades (Task 5) |
| `src/lib/media/caption-pages.ts` (+ `.test.ts`) | Timing das páginas de legenda (Task 5) |
| `src/lib/media/CaptionPage.tsx`, `Captions.tsx` | Legendas estilo TikTok (Task 5) |
| `src/videos/exemplo/schema.ts`, `index.tsx`, `scenes/Intro.tsx`, `Dados.tsx`, `Outro.tsx` | Vídeo de exemplo (Tasks 6 e 8) |
| `scripts/lib/roteiro.ts` (+ `.test.ts`), `scripts/lib/media-files.ts` (+ `.test.ts`) | Funções puras dos scripts de áudio (Task 7) |
| `scripts/whisper-config.ts`, `scripts/voiceover.ts`, `scripts/transcribe.ts` | Narração e legendas (Task 7) |
| `public/exemplo/voiceover/roteiro.json`, `*.mp3`, `*.json` | Assets do exemplo gerados pelos scripts (Task 7) |
| `scripts/lib/slug.ts`, `template.ts`, `root-insert.ts` (+ `.test.ts`), `scripts/templates/video/*.tmpl`, `scripts/new-video.ts` | Gerador de vídeo novo (Task 9) |
| `scripts/smoke.ts` | Still de todas as compositions (Task 10) |
| `AGENTS.md`, `CLAUDE.md`, `README.md` | Documentação (Task 11) |

---

### Task 1: Scaffold do projeto e configuração base

**Files:**
- Create (via `create-video` + cópia): `package.json`, `tsconfig.json`, `remotion.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`, `README.md`, `src/index.ts`, `src/Root.tsx`, `src/Composition.tsx`
- Modify: `package.json` (nome, `type`, scripts), `tsconfig.json` (reescrito), `.gitignore` (linhas extras)
- Create: `.env.example`

**Interfaces:**
- Produces: projeto npm funcional com os scripts `dev`, `render`, `still`, `lint`, `test`, `smoke`, `new-video`, `voiceover`, `transcribe`, `format`, `skills:update`, `upgrade`; todas as dependências Remotion instaladas em 4.0.524.

- [ ] **Step 1: Gerar o scaffold numa pasta temporária**

O `create-video` recusa pastas não vazias e pastas dentro de repositórios git, e `videos/` já tem `.git` e `docs/`. Por isso o scaffold é gerado fora e copiado.

```bash
SCRATCH=/private/tmp/claude-501/-Users-fernandojorge-Desktop-Projetos-apps-Remotion-remotion-main/fa0c8355-893d-43c5-a914-7773a0ac6a37/scratchpad
mkdir -p "$SCRATCH" && cd "$SCRATCH" && rm -rf scaffold
npx --yes create-video@latest --yes --blank --no-tailwind scaffold
ls -la scaffold && cat scaffold/package.json
```

Expected: pasta `scaffold/` com `package.json`, `src/`, `tsconfig.json`, `remotion.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`, `README.md`. No `package.json`, `"remotion"` e `"@remotion/cli"` em `4.0.524`. Se aparecer outra versão, rode `npx remotion upgrade` dentro de `videos/` depois do Step 5.

- [ ] **Step 2: Copiar para `videos/` sem o `.git` do scaffold**

```bash
rsync -a --exclude .git --exclude node_modules "$SCRATCH/scaffold/" /Users/fernandojorge/Desktop/Projetos/apps/Remotion/videos/
cd /Users/fernandojorge/Desktop/Projetos/apps/Remotion/videos && ls -la && git status --short
```

Expected: os arquivos do scaffold aparecem como não rastreados; `docs/` e `.git` originais intactos.

- [ ] **Step 3: Ajustar `package.json` (nome, ESM, scripts) preservando as versões do scaffold**

```bash
cd /Users/fernandojorge/Desktop/Projetos/apps/Remotion/videos && node --input-type=commonjs -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.name = "videos";
p.description = "Kit de vídeos animados em Remotion";
p.type = "module";
p.scripts = {
  dev: "remotion studio",
  render: "remotion render",
  still: "remotion still",
  lint: "eslint src scripts --no-error-on-unmatched-pattern && tsc",
  test: "node --test \"src/**/*.test.ts\"",
  smoke: "node scripts/smoke.ts",
  "new-video": "node scripts/new-video.ts",
  voiceover: "node --env-file-if-exists=.env scripts/voiceover.ts",
  transcribe: "node scripts/transcribe.ts",
  format: "prettier --write src scripts",
  "skills:update": "remotion skills update",
  upgrade: "remotion upgrade",
};
fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
' && cat package.json
```

Expected: `"type": "module"` e os 12 scripts presentes; `dependencies`/`devDependencies` iguais às do scaffold. (O script `test` passa a incluir `scripts/**` na Task 7, quando existir o primeiro teste lá.)

- [ ] **Step 4: Reescrever `tsconfig.json`**

```bash
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "lib": ["ES2022"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "allowImportingTsExtensions": true
  },
  "include": ["src", "scripts"],
  "exclude": ["remotion.config.ts", "scripts/templates"]
}
EOF
```

- [ ] **Step 5: Instalar dependências e os pacotes Remotion do spec §11**

```bash
npm install
for p in @remotion/transitions @remotion/google-fonts @remotion/media @remotion/captions @remotion/shapes @remotion/sfx @remotion/zod-types @remotion/bundler @remotion/renderer @remotion/install-whisper-cpp zod; do
  npx remotion add "$p" || exit 1
done
npm install -D @types/node
grep -E '"(remotion|@remotion/[a-z-]+)":' package.json
```

Expected: todas as linhas `@remotion/*` e `remotion` em `4.0.524`; `zod` presente; `@types/node` em `devDependencies`.

- [ ] **Step 6: `.gitignore` e `.env.example`**

```bash
cat >> .gitignore <<'EOF'

# Kit de vídeos
out/
whisper.cpp/
temp/
.env
.DS_Store
EOF
cat > .env.example <<'EOF'
# Chave da API do ElevenLabs. Só é necessária para gerar narração com
# `npm run voiceover -- <slug> --provider elevenlabs`. O provider padrão (macos) não precisa dela.
ELEVENLABS_API_KEY=
EOF
```

- [ ] **Step 7: Verificar que o scaffold roda**

```bash
npx remotion compositions
npm run lint
```

Expected: `compositions` lista `MyComp`; `lint` termina sem erros (o aviso de padrão não encontrado para `scripts` é esperado e não falha).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold do projeto Remotion com dependências e scripts base

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Skills oficiais do Remotion

**Files:**
- Create: `.agents/skills/*` e symlink `.claude/skills` (gerados pelo instalador)

**Interfaces:**
- Produces: skills `remotion-best-practices`, `remotion-create`, `remotion-markup`, `remotion-interactivity`, `remotion-captions`, `remotion-render`, `remotion-docs`, `remotion-studio`, `remotion-maps`, `remotion-multimedia`, `remotion-saas`, `remotion-upgrade` disponíveis em `.agents/skills`.

- [ ] **Step 1: Instalar**

```bash
npx remotion skills add
ls .agents/skills
ls -la .claude
```

Expected: `.agents/skills/` com as 12 pastas acima (cada uma com `SKILL.md`); `.claude/skills` é um symlink para `../.agents/skills` (ou equivalente). Se o instalador criar pastas para outros agentes (`.cursor`, `.codex`), mantenha.

- [ ] **Step 2: Conferir que a skill principal abre**

```bash
head -12 .agents/skills/remotion-best-practices/SKILL.md
```

Expected: cabeçalho `name: remotion-best-practices` e `version: 4.0.524`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: instala as skills oficiais do Remotion

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Tema e layout

**Files:**
- Create: `src/theme/fonts.ts`, `src/theme/colors.ts`
- Create: `src/lib/layout/format.ts`, `src/lib/layout/format.test.ts`, `src/lib/layout/useFormat.ts`, `src/lib/layout/SafeArea.tsx`

**Interfaces:**
- Produces:
  - `fontFamily: string`, `displayFontFamily: string` (de `src/theme/fonts`)
  - `colors: { background, surface, primary, accent, text, muted, highlight }` (strings hex)
  - `getFormat(width: number, height: number): "vertical" | "horizontal" | "square"`
  - `getSafeAreaMetrics(width: number): { paddingX: number; paddingY: number; baseFontSize: number }`
  - `useFormat(): { format; width; height; isVertical; isHorizontal; isSquare }`
  - `<SafeArea name?: string style?: CSSProperties>{children}</SafeArea>`

- [ ] **Step 1: Escrever o teste das funções puras (falha por não existirem)**

```bash
mkdir -p src/lib/layout src/theme
cat > src/lib/layout/format.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { getFormat, getSafeAreaMetrics } from "./format.ts";

test("getFormat classifica pela proporção", () => {
  assert.equal(getFormat(1080, 1920), "vertical");
  assert.equal(getFormat(1920, 1080), "horizontal");
  assert.equal(getFormat(1080, 1080), "square");
  assert.equal(getFormat(1080, 1350), "vertical");
});

test("getSafeAreaMetrics escala pela largura", () => {
  assert.deepEqual(getSafeAreaMetrics(1080), {
    paddingX: 80,
    paddingY: 100,
    baseFontSize: 44,
  });
  assert.deepEqual(getSafeAreaMetrics(1920), {
    paddingX: 142,
    paddingY: 178,
    baseFontSize: 79,
  });
});
EOF
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: falha com erro de módulo não encontrado (`Cannot find module .../format.ts`).

- [ ] **Step 3: Implementar `format.ts`**

```bash
cat > src/lib/layout/format.ts <<'EOF'
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
EOF
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: `# pass 2`, `# fail 0`.

- [ ] **Step 5: Tema (fontes e cores)**

```bash
cat > src/theme/fonts.ts <<'EOF'
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

// Fonte de corpo: Inter. Fonte de títulos e legendas: Poppins.
// Pesos e subsets limitados para o bundle ficar pequeno. O loadFont() segura o
// render até a fonte carregar, então não é preciso nenhum código extra nas cenas.
const inter = loadInter("normal", {
  weights: ["400", "600", "800"],
  subsets: ["latin"],
});

const poppins = loadPoppins("normal", {
  weights: ["600", "800"],
  subsets: ["latin"],
});

export const fontFamily = inter.fontFamily;
export const displayFontFamily = poppins.fontFamily;
EOF
cat > src/theme/colors.ts <<'EOF'
// Paleta padrão do kit. Só os componentes de src/lib importam este arquivo.
// Nas cenas, copie o valor hexadecimal literalmente (ver a tabela em AGENTS.md),
// porque estilos com referência a constantes não são editáveis no Studio.
export const colors = {
  background: "#0B1020",
  surface: "#161D33",
  primary: "#4F7DFF",
  accent: "#22D3A5",
  text: "#F5F7FA",
  muted: "#9AA4B8",
  highlight: "#FFD166",
} as const;
EOF
```

- [ ] **Step 6: `useFormat` e `SafeArea`**

```bash
cat > src/lib/layout/useFormat.ts <<'EOF'
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
EOF
cat > src/lib/layout/SafeArea.tsx <<'EOF'
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
EOF
```

- [ ] **Step 7: Lint, formato e commit**

```bash
npm run format && npm run lint && npm test
git add src/theme src/lib/layout
git commit -m "feat: tema (fontes e paleta) e layout (formato, área segura)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Expected: lint sem erros, `# pass 2`.

---

### Task 4: Gráficos e contador

**Files:**
- Create: `src/lib/charts/chart-geometry.ts`, `src/lib/charts/chart-geometry.test.ts`, `src/lib/charts/format-number.ts`, `src/lib/charts/format-number.test.ts`, `src/lib/charts/Counter.tsx`, `src/lib/charts/BarChart.tsx`, `src/lib/charts/LineChart.tsx`

**Interfaces:**
- Consumes: `colors`, `fontFamily` (Task 3)
- Produces:
  - `type Datum = { label: string; value: number }`
  - `layoutBars({ data, width, height, gapRatio? }): BarBox[]` com `BarBox = { index, label, value, x, y, width, height }`
  - `layoutLinePoints({ data, width, height }): Point[]` com `Point = { x, y, label, value }`; `pointsToPath(points): string`
  - `formatNumber(value, { decimals?, locale?, prefix?, suffix? }): string`
  - `<Counter to from? durationInFrames? decimals? prefix? suffix? locale? style? />`
  - `<BarChart data width height color? labelColor? enterDurationInFrames? staggerFrames? formatValue? />`
  - `<LineChart data width height color? strokeWidth? showDots? showArea? enterDurationInFrames? />`

- [ ] **Step 1: Testes das funções puras**

```bash
mkdir -p src/lib/charts
cat > src/lib/charts/chart-geometry.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { layoutBars, layoutLinePoints, pointsToPath } from "./chart-geometry.ts";

test("layoutBars distribui as barras e escala pelo maior valor", () => {
  const bars = layoutBars({
    data: [
      { label: "a", value: 50 },
      { label: "b", value: 100 },
    ],
    width: 100,
    height: 200,
    gapRatio: 0.5,
  });
  assert.equal(bars.length, 2);
  assert.equal(bars[0].width, 25);
  assert.equal(bars[0].x, 12.5);
  assert.equal(bars[0].height, 100);
  assert.equal(bars[0].y, 100);
  assert.equal(bars[1].x, 62.5);
  assert.equal(bars[1].height, 200);
  assert.equal(bars[1].y, 0);
});

test("layoutBars com dados vazios ou zerados", () => {
  assert.deepEqual(layoutBars({ data: [], width: 100, height: 100 }), []);
  const zero = layoutBars({ data: [{ label: "a", value: 0 }], width: 100, height: 100 });
  assert.equal(zero[0].height, 0);
  assert.equal(zero[0].y, 100);
});

test("layoutLinePoints e pointsToPath", () => {
  const points = layoutLinePoints({
    data: [
      { label: "a", value: 0 },
      { label: "b", value: 10 },
      { label: "c", value: 5 },
    ],
    width: 200,
    height: 100,
  });
  assert.deepEqual(
    points.map((p) => [p.x, p.y]),
    [
      [0, 100],
      [100, 0],
      [200, 50],
    ],
  );
  assert.equal(pointsToPath(points), "M 0 100 L 100 0 L 200 50");
});
EOF
cat > src/lib/charts/format-number.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatNumber } from "./format-number.ts";

test("formatNumber usa pt-BR por padrão", () => {
  assert.equal(formatNumber(1250), "1.250");
  assert.equal(formatNumber(3.14159, { decimals: 1 }), "3,1");
});

test("formatNumber aplica prefixo e sufixo", () => {
  assert.equal(formatNumber(42, { prefix: "+", suffix: " vídeos" }), "+42 vídeos");
});
EOF
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: os dois arquivos novos falham por módulo não encontrado; `format.test.ts` continua passando.

- [ ] **Step 3: Implementar as funções puras**

```bash
cat > src/lib/charts/chart-geometry.ts <<'EOF'
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
EOF
cat > src/lib/charts/format-number.ts <<'EOF'
export type FormatNumberOptions = {
  decimals?: number;
  locale?: string;
  prefix?: string;
  suffix?: string;
};

export const formatNumber = (
  value: number,
  { decimals = 0, locale = "pt-BR", prefix = "", suffix = "" }: FormatNumberOptions = {},
): string => {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return `${prefix}${formatted}${suffix}`;
};
EOF
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: `# pass 7`, `# fail 0`.

- [ ] **Step 5: Componentes**

```bash
cat > src/lib/charts/Counter.tsx <<'EOF'
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
EOF
cat > src/lib/charts/BarChart.tsx <<'EOF'
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../../theme/colors";
import { fontFamily } from "../../theme/fonts";
import { layoutBars, type Datum } from "./chart-geometry";
import { formatNumber } from "./format-number";

type Props = {
  data: Datum[];
  width: number;
  height: number;
  color?: string;
  labelColor?: string;
  enterDurationInFrames?: number;
  staggerFrames?: number;
  formatValue?: (value: number) => string;
};

// Barras verticais que crescem do zero, uma atrás da outra (stagger).
// O valor aparece acima da barra quando ela passa de 90% da altura final.
export const BarChart: React.FC<Props> = ({
  data,
  width,
  height,
  color = colors.primary,
  labelColor = colors.text,
  enterDurationInFrames = 30,
  staggerFrames = 4,
  formatValue = (value) => formatNumber(value),
}) => {
  const frame = useCurrentFrame();
  const fontSize = Math.round(width * 0.035);
  const valueSpace = Math.round(fontSize * 1.6);
  const labelSpace = Math.round(fontSize * 1.8);
  const chartHeight = height - valueSpace - labelSpace;
  const bars = layoutBars({ data, width, height: chartHeight });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      {bars.map((bar) => {
        const grow = interpolate(
          frame,
          [bar.index * staggerFrames, bar.index * staggerFrames + enterDurationInFrames],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          },
        );
        const barHeight = bar.height * grow;
        const y = valueSpace + chartHeight - barHeight;
        const centerX = bar.x + bar.width / 2;
        return (
          <g key={`${bar.label}-${bar.index}`}>
            <rect
              x={bar.x}
              y={y}
              width={bar.width}
              height={barHeight}
              rx={Math.min(16, bar.width / 4)}
              fill={color}
            />
            <text
              x={centerX}
              y={y - fontSize * 0.4}
              textAnchor="middle"
              fontFamily={fontFamily}
              fontSize={fontSize}
              fontWeight={600}
              fill={labelColor}
              opacity={grow > 0.9 ? 1 : 0}
            >
              {formatValue(bar.value)}
            </text>
            <text
              x={centerX}
              y={height - fontSize * 0.4}
              textAnchor="middle"
              fontFamily={fontFamily}
              fontSize={fontSize}
              fill={labelColor}
              opacity={0.8}
            >
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
EOF
cat > src/lib/charts/LineChart.tsx <<'EOF'
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../../theme/colors";
import { layoutLinePoints, pointsToPath, type Datum } from "./chart-geometry";

type Props = {
  data: Datum[];
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  showArea?: boolean;
  enterDurationInFrames?: number;
};

// Linha revelada da esquerda para a direita (strokeDasharray com pathLength=1),
// com pontos que aparecem conforme a linha chega neles e área opcional embaixo.
export const LineChart: React.FC<Props> = ({
  data,
  width,
  height,
  color = colors.accent,
  strokeWidth = 8,
  showDots = true,
  showArea = true,
  enterDurationInFrames = 45,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, enterDurationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const inset = strokeWidth * 2;
  const points = layoutLinePoints({
    data,
    width: width - inset * 2,
    height: height - inset * 2,
  }).map((p) => ({ ...p, x: p.x + inset, y: p.y + inset }));
  const path = pointsToPath(points);
  const last = points[points.length - 1];
  const areaPath =
    points.length > 1 && last
      ? `${path} L ${last.x} ${height - inset} L ${points[0].x} ${height - inset} Z`
      : "";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      {showArea && areaPath ? <path d={areaPath} fill={color} opacity={0.15 * progress} /> : null}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      {showDots
        ? points.map((p, i) => {
            const threshold = points.length === 1 ? 0 : i / (points.length - 1);
            return (
              <circle
                key={`${p.label}-${i}`}
                cx={p.x}
                cy={p.y}
                r={strokeWidth * 0.9}
                fill={color}
                opacity={progress >= threshold ? 1 : 0}
              />
            );
          })
        : null}
    </svg>
  );
};
EOF
```

- [ ] **Step 6: Lint, formato e commit**

```bash
npm run format && npm run lint && npm test
git add src/lib/charts
git commit -m "feat: gráficos de barras e linhas e contador animado

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Mídia (trilha e legendas)

**Files:**
- Create: `src/lib/media/fade-volume.ts`, `src/lib/media/fade-volume.test.ts`, `src/lib/media/BackgroundMusic.tsx`, `src/lib/media/caption-pages.ts`, `src/lib/media/caption-pages.test.ts`, `src/lib/media/CaptionPage.tsx`, `src/lib/media/Captions.tsx`

**Interfaces:**
- Consumes: `colors`, `fontFamily`, `displayFontFamily` (Task 3)
- Produces:
  - `fadeVolume({ frame, durationInFrames, fadeInFrames, fadeOutFrames, volume }): number`
  - `<BackgroundMusic src volume? fadeInSeconds? fadeOutSeconds? />`
  - `getPageTimings({ pages, fps, switchEveryMs }): { from: number; durationInFrames: number }[]`
  - `<Captions src switchEveryMs? highlightColor? position? />` com `position: "bottom" | "center"`
  - `<CaptionPage page highlightColor position fontSize />`

- [ ] **Step 1: Testes das funções puras**

```bash
mkdir -p src/lib/media
cat > src/lib/media/fade-volume.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { fadeVolume } from "./fade-volume.ts";

const base = { durationInFrames: 300, fadeInFrames: 30, fadeOutFrames: 60, volume: 0.5 };

test("fadeVolume sobe no início, mantém no meio e desce no fim", () => {
  assert.equal(fadeVolume({ ...base, frame: 0 }), 0);
  assert.equal(fadeVolume({ ...base, frame: 15 }), 0.25);
  assert.equal(fadeVolume({ ...base, frame: 30 }), 0.5);
  assert.equal(fadeVolume({ ...base, frame: 150 }), 0.5);
  assert.equal(fadeVolume({ ...base, frame: 270 }), 0.25);
  assert.equal(fadeVolume({ ...base, frame: 300 }), 0);
});

test("fadeVolume sem fades devolve o volume cheio", () => {
  assert.equal(fadeVolume({ ...base, fadeInFrames: 0, fadeOutFrames: 0, frame: 0 }), 0.5);
});
EOF
cat > src/lib/media/caption-pages.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { getPageTimings } from "./caption-pages.ts";

test("getPageTimings corta a página quando a próxima começa", () => {
  const timings = getPageTimings({
    pages: [
      { startMs: 0, tokens: [{ toMs: 900 }] },
      { startMs: 1000, tokens: [{ toMs: 2500 }] },
    ],
    fps: 30,
    switchEveryMs: 1200,
  });
  assert.deepEqual(timings, [
    { from: 0, durationInFrames: 30 },
    { from: 30, durationInFrames: 45 },
  ]);
});

test("getPageTimings com lista vazia", () => {
  assert.deepEqual(getPageTimings({ pages: [], fps: 30, switchEveryMs: 1200 }), []);
});
EOF
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: os dois arquivos novos falham por módulo não encontrado.

- [ ] **Step 3: Implementar as funções puras**

```bash
cat > src/lib/media/fade-volume.ts <<'EOF'
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
  const fadeOut = fadeOutFrames <= 0 ? 1 : Math.min(1, remaining / fadeOutFrames);
  return volume * Math.max(0, fadeIn) * Math.max(0, fadeOut);
};
EOF
cat > src/lib/media/caption-pages.ts <<'EOF'
export type PageLike = { startMs: number; tokens: { toMs: number }[] };
export type PageTiming = { from: number; durationInFrames: number };

// Cada página de legenda fica visível por switchEveryMs (ou até seu último token
// terminar, se for mais tarde), mas nunca depois do início da página seguinte.
export const getPageTimings = ({
  pages,
  fps,
  switchEveryMs,
}: {
  pages: PageLike[];
  fps: number;
  switchEveryMs: number;
}): PageTiming[] => {
  const switchFrames = (switchEveryMs / 1000) * fps;
  return pages.map((page, index) => {
    const next = pages[index + 1] ?? null;
    const from = (page.startMs / 1000) * fps;
    const lastToken = page.tokens[page.tokens.length - 1];
    const tokensEnd = lastToken ? (lastToken.toMs / 1000) * fps : from;
    const naturalEnd = Math.max(from + switchFrames, tokensEnd);
    const end = next ? Math.min((next.startMs / 1000) * fps, naturalEnd) : naturalEnd;
    const roundedFrom = Math.round(from);
    return {
      from: roundedFrom,
      durationInFrames: Math.max(0, Math.round(end) - roundedFrom),
    };
  });
};
EOF
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: `# pass 11`, `# fail 0`.

- [ ] **Step 5: Componentes**

```bash
cat > src/lib/media/BackgroundMusic.tsx <<'EOF'
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
EOF
cat > src/lib/media/CaptionPage.tsx <<'EOF'
import type { TikTokPage } from "@remotion/captions";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { displayFontFamily } from "../../theme/fonts";

type Props = {
  page: TikTokPage;
  highlightColor: string;
  position: "bottom" | "center";
  fontSize: number;
};

// Uma página de legenda: as palavras da página, com a palavra falada destacada.
export const CaptionPage: React.FC<Props> = ({ page, highlightColor, position, fontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteTimeMs = page.startMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill
      style={{
        boxSizing: "border-box",
        justifyContent: position === "bottom" ? "flex-end" : "center",
        alignItems: "center",
        paddingBottom: position === "bottom" ? "12%" : 0,
        paddingLeft: "5%",
        paddingRight: "5%",
      }}
    >
      <div
        style={{
          fontFamily: displayFontFamily,
          fontSize,
          fontWeight: 800,
          lineHeight: 1.15,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          color: "white",
          textShadow:
            "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 16px rgba(0,0,0,0.8)",
        }}
      >
        {page.tokens.map((token, index) => {
          const active = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
          return (
            <span key={`${token.fromMs}-${index}`} style={{ color: active ? highlightColor : "white" }}>
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
EOF
cat > src/lib/media/Captions.tsx <<'EOF'
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  getRemotionEnvironment,
  Sequence,
  useDelayRender,
  useVideoConfig,
  watchStaticFile,
} from "remotion";
import { colors } from "../../theme/colors";
import { fontFamily } from "../../theme/fonts";
import { getPageTimings } from "./caption-pages";
import { CaptionPage } from "./CaptionPage";

type Props = {
  src: string;
  switchEveryMs?: number;
  highlightColor?: string;
  position?: "bottom" | "center";
};

// Carrega um JSON no formato Caption[] (gerado por `npm run transcribe`) e mostra
// legendas estilo TikTok. Arquivo ausente: aviso vermelho no Studio; erro no render.
export const Captions: React.FC<Props> = ({
  src,
  switchEveryMs = 1200,
  highlightColor = colors.accent,
  position = "bottom",
}) => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [missing, setMissing] = useState(false);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender(`Carregando legendas de ${src}`));
  const { fps, width } = useVideoConfig();

  const load = useCallback(async () => {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as Caption[];
      if (!Array.isArray(data)) {
        throw new Error("o JSON não é uma lista de legendas");
      }
      setCaptions(data);
      setMissing(false);
      continueRender(handle);
    } catch (error) {
      const message = `Legendas não encontradas em ${src} (${(error as Error).message}). Gere com: npm run transcribe -- <áudio>`;
      if (getRemotionEnvironment().isRendering) {
        cancelRender(new Error(message));
        return;
      }
      setMissing(true);
      setCaptions([]);
      continueRender(handle);
    }
  }, [src, handle, continueRender, cancelRender]);

  useEffect(() => {
    load();
    const watcher = watchStaticFile(src, () => {
      load();
    });
    return () => {
      watcher.cancel();
    };
  }, [load, src]);

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions: captions ?? [],
        combineTokensWithinMilliseconds: switchEveryMs,
      }),
    [captions, switchEveryMs],
  );
  const timings = useMemo(
    () => getPageTimings({ pages, fps, switchEveryMs }),
    [pages, fps, switchEveryMs],
  );

  if (missing) {
    return (
      <AbsoluteFill name="Legendas ausentes" style={{ justifyContent: "flex-start", alignItems: "stretch" }}>
        <div
          style={{
            margin: 24,
            padding: "16px 24px",
            borderRadius: 12,
            backgroundColor: "#B91C1C",
            color: "white",
            fontFamily,
            fontSize: Math.round(width * 0.028),
            lineHeight: 1.3,
          }}
        >
          {`Legendas não encontradas: ${src}. Rode: npm run transcribe -- public/<slug>/voiceover`}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill name="Legendas" style={{ pointerEvents: "none" }}>
      {pages.map((page, index) => {
        const timing = timings[index];
        if (!timing || timing.durationInFrames <= 0) {
          return null;
        }
        return (
          <Sequence
            key={`${page.startMs}-${index}`}
            name={`Legenda ${index + 1}`}
            from={timing.from}
            durationInFrames={timing.durationInFrames}
          >
            <CaptionPage
              page={page}
              highlightColor={highlightColor}
              position={position}
              fontSize={Math.round(width * 0.055)}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
EOF
```

- [ ] **Step 6: Lint, formato e commit**

```bash
npm run format && npm run lint && npm test
git add src/lib/media
git commit -m "feat: trilha com fades e legendas estilo TikTok

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Vídeo de exemplo (cenas, compositions e Root), ainda sem áudio

**Files:**
- Create: `src/videos/exemplo/schema.ts`, `src/videos/exemplo/scenes/Intro.tsx`, `src/videos/exemplo/scenes/Dados.tsx`, `src/videos/exemplo/scenes/Outro.tsx`, `src/videos/exemplo/index.tsx`
- Modify: `src/Root.tsx` (reescrito)
- Delete: `src/Composition.tsx` (do scaffold)

**Interfaces:**
- Consumes: `SafeArea`, `useFormat`, `displayFontFamily` (Task 3); `BarChart`, `Counter` (Task 4)
- Produces:
  - `exemploSchema` (zod) com `{ title, subtitle, cta, accentColor, data: { label, value }[] }`
  - `Intro({ title, subtitle, accentColor })`, `Dados({ accentColor, data })`, `Outro({ cta, accentColor })`
  - `Exemplo` (componente principal) e `ExemploCompositions` (Folder com 3 formatos + Cenas)
  - Marcador no Root: linha exata `{/* new-video: registre vídeos acima desta linha */}`

- [ ] **Step 1: Schema e cenas**

```bash
mkdir -p src/videos/exemplo/scenes
cat > src/videos/exemplo/schema.ts <<'EOF'
import { zColor } from "@remotion/zod-types";
import { z } from "zod";

export const exemploSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  cta: z.string(),
  accentColor: zColor(),
  data: z.array(z.object({ label: z.string(), value: z.number() })),
});
EOF
cat > src/videos/exemplo/scenes/Intro.tsx <<'EOF'
import { Circle } from "@remotion/shapes";
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SafeArea } from "../../../lib/layout/SafeArea";
import { displayFontFamily } from "../../../theme/fonts";

export type IntroProps = {
  title: string;
  subtitle: string;
  accentColor: string;
};

export const Intro: React.FC<IntroProps> = ({ title, subtitle, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  return (
    <AbsoluteFill name="Intro" style={{ backgroundColor: "#0B1020", overflow: "hidden" }}>
      <Interactive.Div
        name="Mancha de cor"
        style={{
          position: "absolute",
          left: "-10%",
          top: "-10%",
          opacity: 0.55,
          filter: "blur(90px)",
          translate: interpolate(frame, [0, 4 * fps], ["0px 0px", "140px 90px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
        }}
      >
        <Circle radius={width * 0.32} fill={accentColor} />
      </Interactive.Div>
      <SafeArea style={{ justifyContent: "center", alignItems: "flex-start", gap: "0.6em" }}>
        <Interactive.H1
          name="Título"
          style={{
            margin: 0,
            fontFamily: displayFontFamily,
            fontSize: "2.2em",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0, 1 * fps], [0.85, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
            }),
          }}
        >
          {title}
        </Interactive.H1>
        <Interactive.P
          name="Subtítulo"
          style={{
            margin: 0,
            fontSize: "1em",
            fontWeight: 400,
            lineHeight: 1.3,
            color: "#9AA4B8",
            maxWidth: "22em",
            opacity: interpolate(frame, [0.4 * fps, 1 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [0.4 * fps, 1.2 * fps], ["0px 40px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }),
          }}
        >
          {subtitle}
        </Interactive.P>
      </SafeArea>
    </AbsoluteFill>
  );
};
EOF
cat > src/videos/exemplo/scenes/Dados.tsx <<'EOF'
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BarChart } from "../../../lib/charts/BarChart";
import { Counter } from "../../../lib/charts/Counter";
import { SafeArea } from "../../../lib/layout/SafeArea";
import { useFormat } from "../../../lib/layout/useFormat";
import { displayFontFamily } from "../../../theme/fonts";

export type DadosProps = {
  accentColor: string;
  data: { label: string; value: number }[];
};

export const Dados: React.FC<DadosProps> = ({ accentColor, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isHorizontal, isSquare } = useFormat();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  // Largura interna: 920 no vertical e no square, 1636 no horizontal (metade para o gráfico).
  const chartWidth = isHorizontal ? 760 : 920;
  const chartHeight = isHorizontal ? 520 : isSquare ? 420 : 720;

  return (
    <AbsoluteFill name="Dados" style={{ backgroundColor: "#0B1020" }}>
      <SafeArea
        style={{
          flexDirection: isHorizontal ? "row" : "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "1em",
        }}
      >
        <Interactive.Div
          name="Texto dos dados"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.4em",
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [0, 0.8 * fps], ["-60px 0px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }),
          }}
        >
          <Interactive.H2
            name="Título dos dados"
            style={{
              margin: 0,
              fontFamily: displayFontFamily,
              fontSize: "1.6em",
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            Vídeos publicados por mês
          </Interactive.H2>
          <Interactive.P name="Total" style={{ margin: 0, fontSize: "0.9em", color: "#9AA4B8" }}>
            <Counter
              to={total}
              durationInFrames={60}
              suffix=" vídeos"
              style={{
                display: "block",
                fontFamily: displayFontFamily,
                fontSize: "2.4em",
                fontWeight: 800,
                lineHeight: 1.1,
                color: accentColor,
              }}
            />
            em cinco meses
          </Interactive.P>
        </Interactive.Div>
        <Interactive.Div
          name="Gráfico"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <BarChart data={data} width={chartWidth} height={chartHeight} color={accentColor} />
        </Interactive.Div>
      </SafeArea>
    </AbsoluteFill>
  );
};
EOF
cat > src/videos/exemplo/scenes/Outro.tsx <<'EOF'
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SafeArea } from "../../../lib/layout/SafeArea";
import { displayFontFamily } from "../../../theme/fonts";

export type OutroProps = {
  cta: string;
  accentColor: string;
};

export const Outro: React.FC<OutroProps> = ({ cta, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Outro" style={{ backgroundColor: "#0B1020" }}>
      <SafeArea style={{ justifyContent: "center", alignItems: "center", gap: "0.8em", textAlign: "center" }}>
        <Interactive.H1
          name="Chamada"
          style={{
            margin: 0,
            fontFamily: displayFontFamily,
            fontSize: "2.2em",
            fontWeight: 800,
            lineHeight: 1.05,
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0, 1 * fps], [0.9, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
            }),
          }}
        >
          {cta}
        </Interactive.H1>
        <Interactive.Div
          name="Botão"
          style={{
            padding: "0.5em 1.2em",
            borderRadius: 999,
            backgroundColor: accentColor,
            color: "#0B1020",
            fontFamily: displayFontFamily,
            fontSize: "1em",
            fontWeight: 800,
            opacity: interpolate(frame, [0.5 * fps, 1 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0.5 * fps, 1.4 * fps], [0.6, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 20 }),
              output: "perceptual-scale",
            }),
          }}
        >
          Abra o Studio
        </Interactive.Div>
        <Interactive.P
          name="Comando"
          style={{
            margin: 0,
            fontFamily: "monospace",
            fontSize: "0.8em",
            color: "#9AA4B8",
            opacity: interpolate(frame, [1 * fps, 1.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          npm run dev
        </Interactive.P>
      </SafeArea>
    </AbsoluteFill>
  );
};
EOF
```

- [ ] **Step 2: Composição principal, compositions e Root**

```bash
cat > src/videos/exemplo/index.tsx <<'EOF'
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
export const Exemplo: React.FC<ExemploProps> = ({ title, subtitle, cta, accentColor, data }) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Intro" durationInFrames={120}>
        <Intro title={title} subtitle={subtitle} accentColor={accentColor} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
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
          subtitle: "Motion graphics com React e Remotion, editáveis no Studio.",
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
          subtitle: "Motion graphics com React e Remotion, editáveis no Studio.",
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
          subtitle: "Motion graphics com React e Remotion, editáveis no Studio.",
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
            subtitle: "Motion graphics com React e Remotion, editáveis no Studio.",
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
EOF
cat > src/Root.tsx <<'EOF'
import { ExemploCompositions } from "./videos/exemplo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ExemploCompositions />
      {/* new-video: registre vídeos acima desta linha */}
    </>
  );
};
EOF
rm src/Composition.tsx
```

- [ ] **Step 3: Verificar compositions, lint e stills**

```bash
npm run format && npm run lint
npx remotion compositions
mkdir -p out/check
npx remotion still Exemplo-Vertical out/check/vertical-intro.png --frame=40 --scale=0.25
npx remotion still Exemplo-Vertical out/check/vertical-dados.png --frame=200 --scale=0.25
npx remotion still Exemplo-Horizontal out/check/horizontal-dados.png --frame=200 --scale=0.25
npx remotion still Exemplo-Square out/check/square-outro.png --frame=400 --scale=0.25
```

Expected: `compositions` lista exatamente `Exemplo-Vertical`, `Exemplo-Horizontal`, `Exemplo-Square`, `Exemplo-Intro`, `Exemplo-Dados`, `Exemplo-Outro`. Os quatro PNGs existem. Abra cada PNG (ferramenta de leitura de imagem) e confirme: fundo azul-escuro, título legível dentro da margem, gráfico com 5 barras e valores, no horizontal texto à esquerda e gráfico à direita, no outro o botão verde-água centralizado. Na primeira execução o Remotion baixa o Chrome Headless Shell; isso é normal.

- [ ] **Step 4: Commit**

```bash
git add src/Root.tsx src/videos
git rm -q --cached src/Composition.tsx 2>/dev/null; git add -A src
git commit -m "feat: vídeo de exemplo com três cenas nos três formatos

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Scripts de narração e legendas, e assets do exemplo

**Files:**
- Create: `scripts/lib/roteiro.ts`, `scripts/lib/roteiro.test.ts`, `scripts/lib/media-files.ts`, `scripts/lib/media-files.test.ts`, `scripts/whisper-config.ts`, `scripts/voiceover.ts`, `scripts/transcribe.ts`
- Create: `public/exemplo/voiceover/roteiro.json`; gerados: `public/exemplo/voiceover/{intro,dados,outro}.mp3` e `.json`
- Modify: `package.json` (script `test` passa a incluir `scripts/**`)

**Interfaces:**
- Produces:
  - `parseRoteiro(json: string): { voice: string; scenes: Record<string, string> }` (lança `Error` com mensagem em pt-BR)
  - `isTranscribable(file): boolean`, `captionsPathFor(file): string`, `isInside(file, dir): boolean`
  - `WHISPER_PATH`, `WHISPER_VERSION = "1.6.0"`, `WHISPER_MODEL = "medium"`, `WHISPER_LANG = "pt"`
  - CLI `npm run voiceover -- <slug> [--provider macos|elevenlabs] [--voice <nome>]` → `public/<slug>/voiceover/<cena>.mp3` e imprime duração em s e frames
  - CLI `npm run transcribe -- <caminhos...> [--force]` → `<mesmo nome>.json` ao lado de cada áudio

- [ ] **Step 1: Testes das funções puras**

```bash
mkdir -p scripts/lib
cat > scripts/lib/roteiro.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRoteiro } from "./roteiro.ts";

test("parseRoteiro aceita um roteiro válido e limpa espaços", () => {
  const roteiro = parseRoteiro(
    JSON.stringify({ voice: " Luciana ", scenes: { intro: " Olá. ", "cena-2": "Tchau." } }),
  );
  assert.deepEqual(roteiro, { voice: "Luciana", scenes: { intro: "Olá.", "cena-2": "Tchau." } });
});

test("parseRoteiro rejeita JSON inválido", () => {
  assert.throws(() => parseRoteiro("{ nope"), /roteiro.json inválido/);
});

test("parseRoteiro exige voice e scenes", () => {
  assert.throws(() => parseRoteiro(JSON.stringify({ scenes: { a: "x" } })), /"voice"/);
  assert.throws(() => parseRoteiro(JSON.stringify({ voice: "Luciana" })), /"scenes"/);
  assert.throws(() => parseRoteiro(JSON.stringify({ voice: "Luciana", scenes: {} })), /vazio/);
});

test("parseRoteiro valida nomes e textos das cenas", () => {
  assert.throws(() => parseRoteiro(JSON.stringify({ voice: "L", scenes: { Intro: "x" } })), /inválido/);
  assert.throws(() => parseRoteiro(JSON.stringify({ voice: "L", scenes: { intro: "  " } })), /sem texto/);
});
EOF
cat > scripts/lib/media-files.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { captionsPathFor, isInside, isTranscribable } from "./media-files.ts";

test("isTranscribable aceita áudio e vídeo, ignora o resto", () => {
  assert.equal(isTranscribable("a.MP3"), true);
  assert.equal(isTranscribable("pasta/b.mov"), true);
  assert.equal(isTranscribable("roteiro.json"), false);
  assert.equal(isTranscribable("foto.png"), false);
});

test("captionsPathFor troca a extensão por .json", () => {
  assert.equal(captionsPathFor("public/exemplo/voiceover/intro.mp3"), "public/exemplo/voiceover/intro.json");
  assert.equal(captionsPathFor("public/x/clipe.final.mov"), "public/x/clipe.final.json");
});

test("isInside só aceita caminhos dentro da pasta", () => {
  assert.equal(isInside("public/exemplo/a.mp3", "public"), true);
  assert.equal(isInside("src/a.mp3", "public"), false);
  assert.equal(isInside("public", "public"), false);
  assert.equal(isInside("public/../src/a.mp3", "public"), false);
});
EOF
node --input-type=commonjs -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.scripts.test = "node --test \"src/**/*.test.ts\" \"scripts/**/*.test.ts\"";
fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
'
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: os dois testes novos falham por módulo não encontrado; os 11 anteriores passam.

- [ ] **Step 3: Implementar as funções puras e a configuração do Whisper**

```bash
cat > scripts/lib/roteiro.ts <<'EOF'
export type Roteiro = { voice: string; scenes: Record<string, string> };

const SCENE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Valida o public/<slug>/voiceover/roteiro.json: { "voice": "...", "scenes": { "cena": "texto" } }.
export const parseRoteiro = (json: string): Roteiro => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(`roteiro.json inválido: ${(error as Error).message}`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("roteiro.json deve ser um objeto com \"voice\" e \"scenes\"");
  }
  const { voice, scenes } = parsed as { voice?: unknown; scenes?: unknown };
  if (typeof voice !== "string" || voice.trim() === "") {
    throw new Error('roteiro.json precisa de "voice" (nome da voz do macOS ou voiceId do ElevenLabs)');
  }
  if (typeof scenes !== "object" || scenes === null || Array.isArray(scenes)) {
    throw new Error('roteiro.json precisa de "scenes" como objeto { "nomeDaCena": "texto" }');
  }
  const entries = Object.entries(scenes as Record<string, unknown>);
  if (entries.length === 0) {
    throw new Error('"scenes" está vazio');
  }
  const result: Record<string, string> = {};
  for (const [key, text] of entries) {
    if (!SCENE_KEY.test(key)) {
      throw new Error(`nome de cena inválido: "${key}" (use letras minúsculas, números e hífens)`);
    }
    if (typeof text !== "string" || text.trim() === "") {
      throw new Error(`a cena "${key}" está sem texto`);
    }
    result[key] = text.trim();
  }
  return { voice: voice.trim(), scenes: result };
};
EOF
cat > scripts/lib/media-files.ts <<'EOF'
import path from "node:path";

export const TRANSCRIBABLE_EXTENSIONS = [".mp3", ".wav", ".m4a", ".mp4", ".mov", ".webm", ".mkv"];

export const isTranscribable = (file: string): boolean =>
  TRANSCRIBABLE_EXTENSIONS.includes(path.extname(file).toLowerCase());

// O JSON de legendas fica ao lado do áudio, com o mesmo nome.
export const captionsPathFor = (file: string): string => file.replace(/\.[^./\\]+$/, ".json");

export const isInside = (file: string, dir: string): boolean => {
  const relative = path.relative(path.resolve(dir), path.resolve(file));
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
};
EOF
cat > scripts/whisper-config.ts <<'EOF'
import type { Language, WhisperModel } from "@remotion/install-whisper-cpp";
import path from "node:path";

// Onde o Whisper.cpp é clonado e compilado (pasta ignorada pelo git).
export const WHISPER_PATH = path.join(process.cwd(), "whisper.cpp");

// 1.6.0 compila só com git e make. Versões 1.7.4+ exigem cmake, que não está instalado
// nesta máquina. O modelo large-v3-turbo exige 1.7.2+.
export const WHISPER_VERSION = "1.6.0";

// Modelos multilíngues (sem ".en"): tiny (75 MB), base (142 MB), small (466 MB),
// medium (1,5 GB), large-v3 (2,9 GB). Para testar rápido, troque para "small".
export const WHISPER_MODEL: WhisperModel = "medium";

export const WHISPER_LANG: Language = "pt";
EOF
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: `# pass 18`, `# fail 0`.

- [ ] **Step 5: Script de narração**

```bash
cat > scripts/voiceover.ts <<'EOF'
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseRoteiro } from "./lib/roteiro.ts";

const FPS = 30;

const usage = (): never => {
  console.error(
    "Uso: npm run voiceover -- <slug> [--provider macos|elevenlabs] [--voice <nome da voz ou voiceId>]",
  );
  process.exit(1);
};

const args = process.argv.slice(2);
const slug = args[0];
if (!slug || slug.startsWith("--")) {
  usage();
}

const readOption = (name: string): string | null => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : (args[index + 1] ?? null);
};

const forcedProvider = readOption("provider");
if (forcedProvider !== null && forcedProvider !== "macos" && forcedProvider !== "elevenlabs") {
  usage();
}

const root = process.cwd();
const dir = path.join(root, "public", slug, "voiceover");
const roteiroPath = path.join(dir, "roteiro.json");
if (!fs.existsSync(roteiroPath)) {
  console.error(
    `Roteiro não encontrado: ${path.relative(root, roteiroPath)}\n` +
      'Crie o arquivo com { "voice": "Luciana", "scenes": { "intro": "texto da cena..." } }',
  );
  process.exit(1);
}

const roteiro = parseRoteiro(fs.readFileSync(roteiroPath, "utf8"));
const voice = readOption("voice") ?? roteiro.voice;
const apiKey = process.env.ELEVENLABS_API_KEY ?? "";
const provider = forcedProvider ?? (apiKey ? "elevenlabs" : "macos");

if (provider === "elevenlabs" && !apiKey) {
  console.error("O provider elevenlabs exige ELEVENLABS_API_KEY. Copie .env.example para .env e preencha a chave.");
  process.exit(1);
}
if (provider === "macos" && process.platform !== "darwin") {
  console.error("O provider macos só funciona no macOS. Use --provider elevenlabs.");
  process.exit(1);
}

const tempDir = path.join(root, "temp");
fs.mkdirSync(tempDir, { recursive: true });
const remotionBin = path.join(root, "node_modules", ".bin", "remotion");

const remotion = (cliArgs: string[]): string =>
  execFileSync(remotionBin, cliArgs, { stdio: ["ignore", "pipe", "inherit"] }).toString();

const durationInSeconds = (file: string): number =>
  Number(remotion(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).trim());

const generateMacos = (text: string, out: string) => {
  // O say gera AIFF-C comprimido por padrão, que o ffmpeg do Remotion não lê; pedimos WAV PCM.
  const wav = path.join(tempDir, `${path.basename(out, ".mp3")}.wav`);
  execFileSync(
    "say",
    ["-v", voice, "-o", wav, "--file-format=WAVE", "--data-format=LEI16@22050", text],
    { stdio: "inherit" },
  );
  remotion(["ffmpeg", "-y", "-v", "error", "-i", wav, "-codec:a", "libmp3lame", "-q:a", "2", out]);
};

const generateElevenLabs = async (text: string, out: string) => {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
    }),
  });
  if (!response.ok) {
    throw new Error(`ElevenLabs respondeu ${response.status}: ${await response.text()}`);
  }
  fs.writeFileSync(out, Buffer.from(await response.arrayBuffer()));
};

console.log(`Gerando narração de "${slug}" com ${provider} (voz: ${voice})`);
for (const [scene, text] of Object.entries(roteiro.scenes)) {
  const out = path.join(dir, `${scene}.mp3`);
  if (provider === "macos") {
    generateMacos(text, out);
  } else {
    await generateElevenLabs(text, out);
  }
  const seconds = durationInSeconds(out);
  console.log(`  ${scene}.mp3  ${seconds.toFixed(2)} s  =  ${Math.ceil(seconds * FPS)} frames a ${FPS} fps`);
}
fs.rmSync(tempDir, { recursive: true, force: true });
EOF
```

- [ ] **Step 6: Script de transcrição**

```bash
cat > scripts/transcribe.ts <<'EOF'
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { captionsPathFor, isInside, isTranscribable } from "./lib/media-files.ts";
import { WHISPER_LANG, WHISPER_MODEL, WHISPER_PATH, WHISPER_VERSION } from "./whisper-config.ts";

const args = process.argv.slice(2);
const force = args.includes("--force");
const targets = args.filter((arg) => arg !== "--force");
if (targets.length === 0) {
  console.error("Uso: npm run transcribe -- <arquivo ou pasta dentro de public/>... [--force]");
  process.exit(1);
}

const root = process.cwd();
const publicDir = path.join(root, "public");
const tempDir = path.join(root, "temp");
const remotionBin = path.join(root, "node_modules", ".bin", "remotion");

const collectFiles = (target: string): string[] => {
  const full = path.resolve(target);
  if (!fs.existsSync(full)) {
    console.warn(`Ignorando (não existe): ${target}`);
    return [];
  }
  if (fs.statSync(full).isDirectory()) {
    return fs.readdirSync(full).flatMap((entry) => collectFiles(path.join(full, entry)));
  }
  if (!isInside(full, publicDir)) {
    console.warn(`Ignorando (fora de public/): ${target}`);
    return [];
  }
  return isTranscribable(full) ? [full] : [];
};

const files = targets.flatMap(collectFiles);
const pending = files.filter((file) => force || !fs.existsSync(captionsPathFor(file)));
if (pending.length === 0) {
  console.log("Nada a transcrever: todos os arquivos já têm .json ao lado (use --force para refazer).");
  process.exit(0);
}

await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });
await downloadWhisperModel({ folder: WHISPER_PATH, model: WHISPER_MODEL });
fs.mkdirSync(tempDir, { recursive: true });

for (const file of pending) {
  const wav = path.join(tempDir, `${path.basename(file, path.extname(file))}.wav`);
  console.log(`Transcrevendo ${path.relative(root, file)}`);
  execFileSync(remotionBin, ["ffmpeg", "-y", "-i", file, "-ar", "16000", "-ac", "1", wav], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  const whisperCppOutput = await transcribe({
    inputPath: wav,
    model: WHISPER_MODEL,
    whisperPath: WHISPER_PATH,
    whisperCppVersion: WHISPER_VERSION,
    tokenLevelTimestamps: true,
    splitOnWord: true,
    language: WHISPER_LANG,
    translateToEnglish: false,
    printOutput: false,
  });
  const { captions } = toCaptions({ whisperCppOutput });
  const out = captionsPathFor(file);
  fs.writeFileSync(out, JSON.stringify(captions, null, 2));
  console.log(`  -> ${path.relative(root, out)} (${captions.length} palavras)`);
}
fs.rmSync(tempDir, { recursive: true, force: true });
EOF
npm run format && npm run lint
```

Expected: lint sem erros nos scripts.

- [ ] **Step 7: Gerar a narração do exemplo com a voz do macOS**

```bash
mkdir -p public/exemplo/voiceover
cat > public/exemplo/voiceover/roteiro.json <<'EOF'
{
  "voice": "Luciana",
  "scenes": {
    "intro": "Vídeos animados feitos em código, com React e Remotion.",
    "dados": "Em cinco meses, a produção cresceu de doze para quarenta e quatro vídeos por mês. Cento e trinta no total.",
    "outro": "Comece hoje. Abra o Studio e edite a primeira cena."
  }
}
EOF
npm run voiceover -- exemplo
ls -la public/exemplo/voiceover
```

Expected: três linhas `intro.mp3 … s = … frames`, `dados.mp3 …`, `outro.mp3 …` e os três `.mp3` na pasta. Anote os frames de cada um: a Task 8 usa esses números. Se o ffmpeg do Remotion responder `Automatic encoder selection failed` ou `Unknown encoder 'libmp3lame'`, troque no `generateMacos` a extensão de saída para `.m4a` com `-codec:a aac` (ajustando `${scene}.mp3` para `${scene}.m4a` no loop e nas referências da Task 8) e registre isso no commit.

- [ ] **Step 8: Gerar as legendas (instala o Whisper.cpp e baixa o modelo na primeira vez)**

```bash
npm run transcribe -- public/exemplo/voiceover
ls public/exemplo/voiceover
head -c 600 public/exemplo/voiceover/intro.json
```

Expected: clone + `make` do Whisper.cpp 1.6.0 em `whisper.cpp/` (alguns minutos), download do modelo `medium` (1,5 GB), depois três `.json` ao lado dos `.mp3`. O `intro.json` começa com objetos `{ "text": " Vídeos", "startMs": …, "endMs": …, "timestampMs": …, "confidence": … }` em português. Pequenos erros de transcrição (por exemplo "Remotion" virar outra palavra) são aceitáveis; se quiser, corrija só o campo `text` no JSON, nunca os tempos. Rodar de novo o comando deve imprimir "Nada a transcrever".

- [ ] **Step 9: Commit (scripts e assets; `whisper.cpp/` e `temp/` ficam fora pelo .gitignore)**

```bash
npm test
git status --short
git add package.json scripts public/exemplo
git commit -m "feat: scripts de narração (say/ElevenLabs) e legendas (Whisper.cpp) com assets do exemplo

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Expected: `git status` não mostra `whisper.cpp/` nem `temp/`.

---

### Task 8: Narração, legendas e efeitos no exemplo; durações finais; render completo

**Files:**
- Modify: `src/videos/exemplo/scenes/Intro.tsx`, `Dados.tsx`, `Outro.tsx` (áudio + legendas), `src/videos/exemplo/index.tsx` (whooshes e durações)

**Interfaces:**
- Consumes: `Captions` (Task 5), `whoosh` de `@remotion/sfx`, `Audio` de `@remotion/media`, os mp3/json da Task 7

- [ ] **Step 1: Calcular as durações finais**

Regra do spec §9: cada cena precisa de `durationInFrames >= frames da narração + 15`, arredondado para cima ao múltiplo de 30. Valores iniciais: Intro 120, Dados 240, Outro 120. Com os frames impressos na Task 7 Step 7, calcule:

```
introDur = max(120, ceil((framesIntro + 15) / 30) * 30)
dadosDur = max(240, ceil((framesDados + 15) / 30) * 30)
outroDur = max(120, ceil((framesOutro + 15) / 30) * 30)
total    = introDur + dadosDur + outroDur - 30
whoosh1  = introDur - 15
whoosh2  = introDur + dadosDur - 30
```

Exemplo: narração de Dados com 255 frames → dadosDur = ceil(270/30)*30 = 270; total = 120 + 270 + 120 - 30 = 480; whoosh2 = 120 + 270 - 30 = 360.

- [ ] **Step 2: Adicionar narração e legendas nas três cenas**

Em cada cena, acrescente os imports e os dois elementos antes do `</AbsoluteFill>` final. Para `Intro.tsx`:

```tsx
// imports adicionais no topo:
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { Captions } from "../../../lib/media/Captions";

// antes de </AbsoluteFill>:
      <Audio name="Narração" src={staticFile("exemplo/voiceover/intro.mp3")} />
      <Captions src={staticFile("exemplo/voiceover/intro.json")} />
```

Para `Dados.tsx`, o mesmo com `dados.mp3` / `dados.json`; para `Outro.tsx`, com `outro.mp3` / `outro.json`. Como `remotion` já é importado nas cenas, acrescente `staticFile` à lista existente em vez de duplicar o import.

- [ ] **Step 3: Whooshes e durações em `index.tsx`**

Substitua o `Exemplo` por esta versão, trocando `120`, `240`, `120`, `105`, `330` e `450` pelos valores calculados no Step 1 (se forem os mesmos, mantenha):

```tsx
import { Audio } from "@remotion/media";
import { whoosh } from "@remotion/sfx";
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
// Os whooshes começam no início de cada transição: 120 - 15 = 105 e 120 + 240 - 30 = 330.
export const Exemplo: React.FC<ExemploProps> = ({ title, subtitle, cta, accentColor, data }) => {
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Intro" durationInFrames={120}>
          <Intro title={title} subtitle={subtitle} accentColor={accentColor} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
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
      <Audio name="Whoosh 1" src={whoosh} from={105} durationInFrames={30} volume={0.5} />
      <Audio name="Whoosh 2" src={whoosh} from={330} durationInFrames={30} volume={0.5} />
    </>
  );
};
```

Atualize também `durationInFrames` das três compositions principais (`Exemplo-Vertical`, `-Horizontal`, `-Square`) para `total`, e das cenas em `Cenas` para `introDur`, `dadosDur`, `outroDur`.

- [ ] **Step 4: Lint, stills e render completo**

```bash
npm run format && npm run lint
npx remotion still Exemplo-Vertical out/check/vertical-legenda.png --frame=45 --scale=0.25
npm run render -- Exemplo-Vertical
node_modules/.bin/remotion ffprobe -v error -show_streams -select_streams a out/Exemplo-Vertical.mp4 | grep codec_name
node_modules/.bin/remotion ffmpeg -y -ss 1.5 -i out/Exemplo-Vertical.mp4 -frames:v 1 out/check/render-1s.png
node_modules/.bin/remotion ffmpeg -y -ss 6 -i out/Exemplo-Vertical.mp4 -frames:v 1 out/check/render-6s.png
node_modules/.bin/remotion ffmpeg -y -ss 13 -i out/Exemplo-Vertical.mp4 -frames:v 1 out/check/render-13s.png
```

Expected: o still do frame 45 mostra legenda branca com uma palavra verde-água na parte de baixo; o render termina em `out/Exemplo-Vertical.mp4` com duração `total / 30` segundos; `ffprobe` imprime `codec_name=aac`; nos frames extraídos aparecem legenda (1,5 s), gráfico (6 s) e botão (13 s). Abra os PNGs para confirmar.

- [ ] **Step 5: Commit**

```bash
git add src/videos/exemplo
git commit -m "feat: narração, legendas e efeitos sonoros no vídeo de exemplo

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Gerador de vídeo novo (`npm run new-video`)

**Files:**
- Create: `scripts/lib/slug.ts`, `scripts/lib/slug.test.ts`, `scripts/lib/template.ts`, `scripts/lib/template.test.ts`, `scripts/lib/root-insert.ts`, `scripts/lib/root-insert.test.ts`
- Create: `scripts/templates/video/index.tsx.tmpl`, `schema.ts.tmpl`, `scenes/Intro.tsx.tmpl`, `scenes/Outro.tsx.tmpl`, `roteiro.json.tmpl`
- Create: `scripts/new-video.ts`

**Interfaces:**
- Consumes: marcador do Root (Task 6): `{/* new-video: registre vídeos acima desta linha */}`
- Produces:
  - `isValidSlug(slug): boolean`, `toPascalCase(slug): string`
  - `renderTemplate(source, vars: Record<string, string>): string` (placeholders `__nome__`; desconhecido lança `Error`)
  - `ROOT_MARKER`, `insertVideoIntoRoot(source, { slug, pascal }): { source; inserted: boolean; reason: "already-registered" | "marker-missing" | null }`
  - CLI `npm run new-video -- <slug> [--title "..."]`

- [ ] **Step 1: Testes das funções puras**

```bash
cat > scripts/lib/slug.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidSlug, toPascalCase } from "./slug.ts";

test("isValidSlug aceita kebab-case minúsculo", () => {
  assert.equal(isValidSlug("lancamento-app"), true);
  assert.equal(isValidSlug("video2"), true);
  assert.equal(isValidSlug("Lancamento"), false);
  assert.equal(isValidSlug("com espaço"), false);
  assert.equal(isValidSlug("-comeca-com-hifen"), false);
  assert.equal(isValidSlug(""), false);
});

test("toPascalCase junta as partes", () => {
  assert.equal(toPascalCase("lancamento-app"), "LancamentoApp");
  assert.equal(toPascalCase("meu-video-2"), "MeuVideo2");
});
EOF
cat > scripts/lib/template.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderTemplate } from "./template.ts";

test("renderTemplate substitui todos os placeholders", () => {
  const out = renderTemplate('id="__Slug__-Vertical" src="__slug__" title="__Titulo__"', {
    slug: "meu-video",
    Slug: "MeuVideo",
    Titulo: "Meu vídeo",
  });
  assert.equal(out, 'id="MeuVideo-Vertical" src="meu-video" title="Meu vídeo"');
});

test("renderTemplate falha em placeholder desconhecido", () => {
  assert.throws(() => renderTemplate("__Nada__", { slug: "x" }), /Placeholder desconhecido: __Nada__/);
});
EOF
cat > scripts/lib/root-insert.test.ts <<'EOF'
import assert from "node:assert/strict";
import { test } from "node:test";
import { insertVideoIntoRoot, ROOT_MARKER } from "./root-insert.ts";

const root = `import { ExemploCompositions } from "./videos/exemplo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ExemploCompositions />
      ${ROOT_MARKER}
    </>
  );
};
`;

test("insertVideoIntoRoot adiciona import e JSX acima do marcador", () => {
  const result = insertVideoIntoRoot(root, { slug: "meu-video", pascal: "MeuVideo" });
  assert.equal(result.inserted, true);
  assert.equal(result.reason, null);
  assert.equal(
    result.source,
    `import { ExemploCompositions } from "./videos/exemplo";
import { MeuVideoCompositions } from "./videos/meu-video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <ExemploCompositions />
      <MeuVideoCompositions />
      ${ROOT_MARKER}
    </>
  );
};
`,
  );
});

test("insertVideoIntoRoot não duplica um vídeo já registrado", () => {
  const once = insertVideoIntoRoot(root, { slug: "meu-video", pascal: "MeuVideo" }).source;
  const twice = insertVideoIntoRoot(once, { slug: "meu-video", pascal: "MeuVideo" });
  assert.equal(twice.inserted, false);
  assert.equal(twice.reason, "already-registered");
  assert.equal(twice.source, once);
});

test("insertVideoIntoRoot avisa quando o marcador sumiu", () => {
  const result = insertVideoIntoRoot(root.replace(ROOT_MARKER, ""), { slug: "x", pascal: "X" });
  assert.equal(result.inserted, false);
  assert.equal(result.reason, "marker-missing");
});
EOF
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: os três arquivos novos falham por módulo não encontrado.

- [ ] **Step 3: Implementar as funções puras**

```bash
cat > scripts/lib/slug.ts <<'EOF'
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isValidSlug = (slug: string): boolean => SLUG_RE.test(slug);

// "lancamento-app" -> "LancamentoApp" (usado em IDs de composition e nomes de componente)
export const toPascalCase = (slug: string): string =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
EOF
cat > scripts/lib/template.ts <<'EOF'
// Substitui placeholders no formato __nome__ pelos valores de vars.
export const renderTemplate = (source: string, vars: Record<string, string>): string =>
  source.replace(/__([A-Za-z]+)__/g, (match, key: string) => {
    if (!(key in vars)) {
      throw new Error(`Placeholder desconhecido: ${match}`);
    }
    return vars[key];
  });
EOF
cat > scripts/lib/root-insert.ts <<'EOF'
export const ROOT_MARKER = "{/* new-video: registre vídeos acima desta linha */}";

export type RootInsertResult = {
  source: string;
  inserted: boolean;
  reason: "already-registered" | "marker-missing" | null;
};

// Registra <PascalCompositions /> no src/Root.tsx: JSX acima do marcador e import
// depois do último import existente.
export const insertVideoIntoRoot = (
  source: string,
  { slug, pascal }: { slug: string; pascal: string },
): RootInsertResult => {
  const importLine = `import { ${pascal}Compositions } from "./videos/${slug}";`;
  const jsxLine = `<${pascal}Compositions />`;
  if (source.includes(importLine)) {
    return { source, inserted: false, reason: "already-registered" };
  }
  const markerIndex = source.indexOf(ROOT_MARKER);
  if (markerIndex === -1) {
    return { source, inserted: false, reason: "marker-missing" };
  }
  const lineStart = source.lastIndexOf("\n", markerIndex) + 1;
  const indent = source.slice(lineStart, markerIndex);
  const withJsx = source.slice(0, lineStart) + indent + jsxLine + "\n" + source.slice(lineStart);

  const importRe = /^import .*;$/gm;
  let last: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;
  while ((match = importRe.exec(withJsx)) !== null) {
    last = match;
  }
  const withImport = last
    ? withJsx.slice(0, last.index + last[0].length) + "\n" + importLine + withJsx.slice(last.index + last[0].length)
    : importLine + "\n" + withJsx;
  return { source: withImport, inserted: true, reason: null };
};
EOF
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: `# pass 25`, `# fail 0`.

- [ ] **Step 5: Templates do vídeo novo**

```bash
mkdir -p scripts/templates/video/scenes
cat > scripts/templates/video/schema.ts.tmpl <<'EOF'
import { zColor } from "@remotion/zod-types";
import { z } from "zod";

export const __Slug__Schema = z.object({
  title: z.string(),
  subtitle: z.string(),
  accentColor: zColor(),
});
EOF
cat > scripts/templates/video/roteiro.json.tmpl <<'EOF'
{
  "voice": "Luciana",
  "scenes": {
    "intro": "Escreva aqui a narração da abertura de __Titulo__.",
    "outro": "E aqui a narração do encerramento."
  }
}
EOF
cat > scripts/templates/video/scenes/Intro.tsx.tmpl <<'EOF'
import { Circle } from "@remotion/shapes";
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SafeArea } from "../../../lib/layout/SafeArea";
import { displayFontFamily } from "../../../theme/fonts";

export type IntroProps = {
  title: string;
  subtitle: string;
  accentColor: string;
};

export const Intro: React.FC<IntroProps> = ({ title, subtitle, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  return (
    <AbsoluteFill name="Intro" style={{ backgroundColor: "#0B1020", overflow: "hidden" }}>
      <Interactive.Div
        name="Mancha de cor"
        style={{
          position: "absolute",
          left: "-10%",
          top: "-10%",
          opacity: 0.55,
          filter: "blur(90px)",
          translate: interpolate(frame, [0, 4 * fps], ["0px 0px", "140px 90px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          }),
        }}
      >
        <Circle radius={width * 0.32} fill={accentColor} />
      </Interactive.Div>
      <SafeArea style={{ justifyContent: "center", alignItems: "flex-start", gap: "0.6em" }}>
        <Interactive.H1
          name="Título"
          style={{
            margin: 0,
            fontFamily: displayFontFamily,
            fontSize: "2.2em",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0, 1 * fps], [0.85, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
            }),
          }}
        >
          {title}
        </Interactive.H1>
        <Interactive.P
          name="Subtítulo"
          style={{
            margin: 0,
            fontSize: "1em",
            lineHeight: 1.3,
            color: "#9AA4B8",
            maxWidth: "22em",
            opacity: interpolate(frame, [0.4 * fps, 1 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [0.4 * fps, 1.2 * fps], ["0px 40px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }),
          }}
        >
          {subtitle}
        </Interactive.P>
      </SafeArea>
      {/*
        Narração e legendas. Depois de rodar
          npm run voiceover -- __slug__
          npm run transcribe -- public/__slug__/voiceover
        adicione os imports e os elementos abaixo:
          import { Audio } from "@remotion/media";
          import { staticFile } from "remotion";
          import { Captions } from "../../../lib/media/Captions";
          <Audio name="Narração" src={staticFile("__slug__/voiceover/intro.mp3")} />
          <Captions src={staticFile("__slug__/voiceover/intro.json")} />
      */}
    </AbsoluteFill>
  );
};
EOF
cat > scripts/templates/video/scenes/Outro.tsx.tmpl <<'EOF'
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SafeArea } from "../../../lib/layout/SafeArea";
import { displayFontFamily } from "../../../theme/fonts";

export type OutroProps = {
  accentColor: string;
};

export const Outro: React.FC<OutroProps> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Outro" style={{ backgroundColor: "#0B1020" }}>
      <SafeArea style={{ justifyContent: "center", alignItems: "center", gap: "0.8em", textAlign: "center" }}>
        <Interactive.H1
          name="Encerramento"
          style={{
            margin: 0,
            fontFamily: displayFontFamily,
            fontSize: "2.2em",
            fontWeight: 800,
            lineHeight: 1.05,
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0, 1 * fps], [0.9, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
            }),
          }}
        >
          Obrigado por assistir
        </Interactive.H1>
        <Interactive.Div
          name="Botão"
          style={{
            padding: "0.5em 1.2em",
            borderRadius: 999,
            backgroundColor: accentColor,
            color: "#0B1020",
            fontFamily: displayFontFamily,
            fontSize: "1em",
            fontWeight: 800,
            opacity: interpolate(frame, [0.5 * fps, 1 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0.5 * fps, 1.4 * fps], [0.6, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 20 }),
              output: "perceptual-scale",
            }),
          }}
        >
          Saiba mais
        </Interactive.Div>
      </SafeArea>
    </AbsoluteFill>
  );
};
EOF
cat > scripts/templates/video/index.tsx.tmpl <<'EOF'
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Composition, Folder } from "remotion";
import type { z } from "zod";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { __Slug__Schema } from "./schema";

type __Slug__Props = z.infer<typeof __Slug__Schema>;

// Duração total: Intro 120 + Outro 120 = 240 frames, menos uma transição de 15 = 225.
export const __Slug__: React.FC<__Slug__Props> = ({ title, subtitle, accentColor }) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Intro" durationInFrames={120}>
        <Intro title={title} subtitle={subtitle} accentColor={accentColor} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
      <TransitionSeries.Sequence name="Outro" durationInFrames={120}>
        <Outro accentColor={accentColor} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export const __Slug__Compositions: React.FC = () => {
  return (
    <Folder name="__Slug__">
      <Composition
        id="__Slug__-Vertical"
        component={__Slug__}
        schema={__Slug__Schema}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={225}
        defaultProps={{
          title: "__Titulo__",
          subtitle: "Troque este subtítulo no painel de props.",
          accentColor: "#22D3A5",
        }}
      />
      <Composition
        id="__Slug__-Horizontal"
        component={__Slug__}
        schema={__Slug__Schema}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={225}
        defaultProps={{
          title: "__Titulo__",
          subtitle: "Troque este subtítulo no painel de props.",
          accentColor: "#22D3A5",
        }}
      />
      <Composition
        id="__Slug__-Square"
        component={__Slug__}
        schema={__Slug__Schema}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={225}
        defaultProps={{
          title: "__Titulo__",
          subtitle: "Troque este subtítulo no painel de props.",
          accentColor: "#22D3A5",
        }}
      />
      <Folder name="Cenas">
        <Composition
          id="__Slug__-Intro"
          component={Intro}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={120}
          defaultProps={{
            title: "__Titulo__",
            subtitle: "Troque este subtítulo no painel de props.",
            accentColor: "#22D3A5",
          }}
        />
        <Composition
          id="__Slug__-Outro"
          component={Outro}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={120}
          defaultProps={{ accentColor: "#22D3A5" }}
        />
      </Folder>
    </Folder>
  );
};
EOF
```

- [ ] **Step 6: Script `new-video.ts`**

```bash
cat > scripts/new-video.ts <<'EOF'
import fs from "node:fs";
import path from "node:path";
import { insertVideoIntoRoot } from "./lib/root-insert.ts";
import { isValidSlug, toPascalCase } from "./lib/slug.ts";
import { renderTemplate } from "./lib/template.ts";

const args = process.argv.slice(2);
const slug = args[0];
const titleIndex = args.indexOf("--title");
const title = titleIndex === -1 ? null : (args[titleIndex + 1] ?? null);

if (!slug || slug.startsWith("--")) {
  console.error('Uso: npm run new-video -- <slug> [--title "Título do vídeo"]');
  process.exit(1);
}
if (!isValidSlug(slug)) {
  console.error(`Slug inválido: "${slug}". Use letras minúsculas, números e hífens, por exemplo: lancamento-app`);
  process.exit(1);
}

const root = process.cwd();
const videoDir = path.join(root, "src", "videos", slug);
if (fs.existsSync(videoDir)) {
  console.error(`Já existe: ${path.relative(root, videoDir)}`);
  process.exit(1);
}

const pascal = toPascalCase(slug);
const vars = { slug, Slug: pascal, Titulo: (title ?? slug).replace(/"/g, '\\"') };
const templateDir = path.join(root, "scripts", "templates", "video");

const writeFromTemplate = (templateFile: string, outFile: string) => {
  const source = fs.readFileSync(path.join(templateDir, templateFile), "utf8");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, renderTemplate(source, vars));
  console.log(`  criado ${path.relative(root, outFile)}`);
};

console.log(`Criando vídeo "${slug}" (${pascal})`);
writeFromTemplate("index.tsx.tmpl", path.join(videoDir, "index.tsx"));
writeFromTemplate("schema.ts.tmpl", path.join(videoDir, "schema.ts"));
writeFromTemplate("scenes/Intro.tsx.tmpl", path.join(videoDir, "scenes", "Intro.tsx"));
writeFromTemplate("scenes/Outro.tsx.tmpl", path.join(videoDir, "scenes", "Outro.tsx"));
writeFromTemplate("roteiro.json.tmpl", path.join(root, "public", slug, "voiceover", "roteiro.json"));

const rootFile = path.join(root, "src", "Root.tsx");
const result = insertVideoIntoRoot(fs.readFileSync(rootFile, "utf8"), { slug, pascal });
if (result.inserted) {
  fs.writeFileSync(rootFile, result.source);
  console.log("  registrado em src/Root.tsx");
} else if (result.reason === "already-registered") {
  console.log("  src/Root.tsx já registra este vídeo");
} else {
  console.log(
    `  Marcador não encontrado em src/Root.tsx. Adicione manualmente:\n` +
      `    import { ${pascal}Compositions } from "./videos/${slug}";\n` +
      `    <${pascal}Compositions />`,
  );
}

console.log(`\nPronto. Abra o Studio com: npm run dev  ->  http://localhost:3000/${pascal}-Vertical`);
EOF
npm run format && npm run lint
```

- [ ] **Step 7: Teste de ponta a ponta do gerador**

```bash
npm run new-video -- teste-rapido --title "Teste rápido"
cat src/Root.tsx
npm run lint
npx remotion compositions | grep TesteRapido
npx remotion still TesteRapido-Vertical out/check/teste-rapido.png --frame=30 --scale=0.25
```

Expected: cinco arquivos criados (`index.tsx`, `schema.ts`, `scenes/Intro.tsx`, `scenes/Outro.tsx`, `public/teste-rapido/voiceover/roteiro.json`); `Root.tsx` com o import e `<TesteRapidoCompositions />` acima do marcador; lint limpo; `compositions` lista `TesteRapido-Vertical`, `-Horizontal`, `-Square`, `-Intro`, `-Outro`; o PNG mostra o título "Teste rápido".

- [ ] **Step 8: Desfazer o vídeo de teste e commitar o gerador**

```bash
rm -rf src/videos/teste-rapido public/teste-rapido
git checkout -- src/Root.tsx
npm run lint && npm test
git add scripts
git commit -m "feat: gerador de vídeo novo (npm run new-video)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Expected: `git status` limpo depois do commit (sem restos de `teste-rapido`).

---

### Task 10: Teste de fumaça (`npm run smoke`)

**Files:**
- Create: `scripts/smoke.ts`

**Interfaces:**
- Consumes: `bundle` de `@remotion/bundler`; `getCompositions`, `renderStill` de `@remotion/renderer`
- Produces: `out/smoke/<id>.png` para cada composition; código de saída 1 se alguma falhar

- [ ] **Step 1: Escrever o script**

```bash
cat > scripts/smoke.ts <<'EOF'
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

// Renderiza o frame do meio de cada composition em out/smoke/. Se alguma quebrar,
// o script falha listando os ids. É o teste de fumaça do projeto.
const root = process.cwd();
const outDir = path.join(root, "out", "smoke");
fs.mkdirSync(outDir, { recursive: true });

console.log("Empacotando o projeto...");
const serveUrl = await bundle({
  entryPoint: path.join(root, "src", "index.ts"),
  publicDir: path.join(root, "public"),
  onProgress: () => undefined,
});

const compositions = await getCompositions(serveUrl);
console.log(`${compositions.length} compositions encontradas`);

const failures: string[] = [];
for (const composition of compositions) {
  const output = path.join(outDir, `${composition.id}.png`);
  try {
    await renderStill({
      composition,
      serveUrl,
      output,
      frame: Math.floor(composition.durationInFrames / 2),
      scale: 0.25,
    });
    console.log(`  ok      ${composition.id}  -> ${path.relative(root, output)}`);
  } catch (error) {
    failures.push(composition.id);
    console.error(`  FALHOU  ${composition.id}`);
    console.error(error);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} composition(s) com erro: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nTodas as compositions renderizaram um still.");
EOF
npm run format && npm run lint
```

- [ ] **Step 2: Rodar**

```bash
npm run smoke
ls out/smoke
```

Expected: `6 compositions encontradas`, seis linhas `ok`, seis PNGs em `out/smoke/`, mensagem final de sucesso, código de saída 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke.ts
git commit -m "feat: teste de fumaça que renderiza um still de cada composition

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Documentação (AGENTS.md, CLAUDE.md, README.md)

**Files:**
- Create: `AGENTS.md`, `CLAUDE.md`
- Modify: `README.md` (reescrito)

**Interfaces:**
- Consumes: todas as APIs das Tasks 3 a 10 (os nomes abaixo têm que bater com o código)

- [ ] **Step 1: AGENTS.md**

```bash
cat > AGENTS.md <<'EOF'
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
   `<Audio>` e `<Captions>` (seção 9). Use os frames impressos pelo voiceover para dimensionar as cenas.
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

Lista com stagger (use `from` em cada item, com valores literais):

```tsx
<Interactive.Div name="Item 1" from={0} style={{ opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Rápido</Interactive.Div>
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

Efeito sonoro numa transição (URLs em `@remotion/sfx`: `whoosh`, `whip`, `ding`, `pageTurn`...):

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

`<Captions>` aceita `switchEveryMs` (padrão 1200; menor = menos palavras por página),
`highlightColor` (padrão accent) e `position` (`"bottom"` ou `"center"`). Se o JSON não existir,
o Studio mostra uma faixa vermelha e o render falha de propósito.

`roteiro.json` (uma entrada por cena, chaves em kebab-case):

```json
{ "voice": "Luciana", "scenes": { "intro": "Texto da abertura.", "outro": "Texto do fim." } }
```

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
EOF
```

- [ ] **Step 2: CLAUDE.md e README.md**

```bash
cat > CLAUDE.md <<'EOF'
# CLAUDE.md

Este projeto usa `AGENTS.md` como fonte de instruções. Leia [AGENTS.md](AGENTS.md) antes de
qualquer tarefa. As skills oficiais do Remotion ficam em `.agents/skills` (espelhadas em `.claude/skills`).
EOF
cat > README.md <<'EOF'
# videos

Kit para produzir vídeos animados em código com [Remotion](https://www.remotion.dev) 4.0.524,
nos formatos vertical (1080x1920), horizontal (1920x1080) e quadrado (1080x1080).

```bash
npm install
npm run dev                               # Remotion Studio em http://localhost:3000
npm run render -- Exemplo-Vertical        # gera out/Exemplo-Vertical.mp4
npm run new-video -- meu-video --title "Meu vídeo"
npm run voiceover -- meu-video            # narração (voz do macOS; ElevenLabs com .env)
npm run transcribe -- public/meu-video/voiceover   # legendas
npm run lint && npm test && npm run smoke
```

Convenções, estrutura e receitas de animação: [AGENTS.md](AGENTS.md).
Design e plano: `docs/superpowers/`.
EOF
```

- [ ] **Step 3: Conferir nomes citados na documentação contra o código**

```bash
grep -c "Interactive" src/videos/exemplo/scenes/Intro.tsx
grep -n "export const" src/lib/charts/BarChart.tsx src/lib/charts/LineChart.tsx src/lib/charts/Counter.tsx src/lib/media/Captions.tsx src/lib/media/BackgroundMusic.tsx src/lib/layout/SafeArea.tsx src/lib/layout/useFormat.ts
grep -n "new-video: registre" src/Root.tsx
```

Expected: os exports `BarChart`, `LineChart`, `Counter`, `Captions`, `BackgroundMusic`, `SafeArea`, `useFormat` existem com esses nomes; o marcador está no Root.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md CLAUDE.md README.md
git commit -m "docs: AGENTS.md com convenções e cookbook, CLAUDE.md e README

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Verificação final (spec §13)

**Files:** nenhum novo; correções pontuais se algo falhar, commitadas com `fix:`.

- [ ] **Step 1: Checklist automatizado**

```bash
npm run lint
npm test
npx remotion compositions
npm run smoke
```

Expected: lint e testes verdes (`# pass 25`); exatamente as 6 compositions do exemplo; smoke com 6 `ok`.

- [ ] **Step 2: Render e conferência dos três formatos**

```bash
npm run render -- Exemplo-Horizontal
npm run render -- Exemplo-Square
ls -la out/*.mp4
node_modules/.bin/remotion ffprobe -v error -show_entries format=duration -of csv=p=0 out/Exemplo-Vertical.mp4
node_modules/.bin/remotion ffmpeg -y -ss 6 -i out/Exemplo-Horizontal.mp4 -frames:v 1 out/check/horizontal-6s.png
node_modules/.bin/remotion ffmpeg -y -ss 6 -i out/Exemplo-Square.mp4 -frames:v 1 out/check/square-6s.png
```

Expected: três mp4; duração do vertical igual a `total / 30` s; os frames de 6 s mostram o gráfico no layout de cada formato.

- [ ] **Step 3: Studio no navegador da sessão**

```bash
npx remotion studio --no-open --port 3000
```

Rode em segundo plano, abra `http://localhost:3000/Exemplo-Vertical` no navegador da sessão, tire uma captura de tela com a composition carregada e a timeline mostrando `Intro`, `Dados`, `Outro`, `Whoosh 1`, `Whoosh 2`. Depois encerre o processo do Studio.

- [ ] **Step 4: Fluxo do gerador uma última vez**

```bash
npm run new-video -- checagem-final
npm run lint
rm -rf src/videos/checagem-final public/checagem-final && git checkout -- src/Root.tsx
git status --short
```

Expected: gerador funciona, lint passa, árvore limpa no fim.

- [ ] **Step 5: Relatório**

Liste no relatório final: os comandos rodados com resultado, os caminhos dos PNGs e mp4 conferidos, o que ficou fora do escopo (spec §14) e qualquer desvio do spec (por exemplo, troca de mp3 por m4a na Task 7).

---

## Desvios registrados na execução

- Task 1: o `create-video` 4.0.524 injetou Tailwind mesmo com `--no-tailwind`; removido à mão (index.css, `enableTailwind`, dependências). O script `format` ganhou `--no-error-on-unmatched-pattern`.
- Task 7: o `say` gera AIFF-C, que o ffmpeg do Remotion não lê; o provider macos pede WAV PCM (`--file-format=WAVE --data-format=LEI16@22050`). O downloader do Whisper não retoma parciais; o modelo foi baixado com `curl -C -` e o script só validou o tamanho.
- Task 8: durações finais Intro 150, Dados 270, Outro 150 (total 540); dois textos de legenda corrigidos ("e-código", "estúdio").
- Pós-Task 12: `SafeArea` ganhou a prop `captionSpace` (reserva 20% da altura), a fonte das legendas passou a 5,5% do menor lado e o offset inferior a 7% da altura, porque a legenda cobria o gráfico no quadrado e no horizontal. A cena Dados agrupa texto e gráfico fora do horizontal.
