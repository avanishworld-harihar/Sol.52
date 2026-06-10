import { Cormorant_Garamond, Inter } from "next/font/google";

/** Display serif — headlines and thesis numbers. */
export const epDisplayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--ep-font-display",
  display: "swap",
});

/** Data sans — labels, body, tabular figures. */
export const epDataFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--ep-font-data",
  display: "swap",
});

export const epFontClassName = `${epDisplayFont.variable} ${epDataFont.variable}`;
