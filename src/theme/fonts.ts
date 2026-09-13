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
