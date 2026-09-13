import { zColor } from "@remotion/zod-types";
import { z } from "zod";

export const exemploSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  cta: z.string(),
  accentColor: zColor(),
  data: z.array(z.object({ label: z.string(), value: z.number() })),
});
