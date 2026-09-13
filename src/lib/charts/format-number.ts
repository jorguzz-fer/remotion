export type FormatNumberOptions = {
  decimals?: number;
  locale?: string;
  prefix?: string;
  suffix?: string;
};

export const formatNumber = (
  value: number,
  {
    decimals = 0,
    locale = "pt-BR",
    prefix = "",
    suffix = "",
  }: FormatNumberOptions = {},
): string => {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return `${prefix}${formatted}${suffix}`;
};
