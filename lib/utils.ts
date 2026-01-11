import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type NairaFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatNaira(
  value: number | null | undefined,
  opts: NairaFormatOptions = {}
): string {
  const n = typeof value === "number" && isFinite(value) ? value : 0;
  const sign = n < 0 ? "-" : "";
  const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = opts;
  const formatted = Math.abs(n).toLocaleString("en-NG", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
  return `${sign}₦${formatted}`;
}
