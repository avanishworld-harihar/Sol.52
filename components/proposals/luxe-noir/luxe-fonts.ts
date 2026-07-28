import { Cormorant_Garamond } from "next/font/google";

/** Premium Luxe display serif — headers & verdict body. */
export const luxeDisplayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--luxe-display",
  display: "swap",
});
