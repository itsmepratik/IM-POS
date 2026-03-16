import React from "react";
import Barcode from "react-barcode";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Generates a barcode as an SVG HTML string ready to be injected into the DOM/Print window.
 * Defaults to Code 128 format.
 *
 * @param text The text to encode in the barcode
 * @param options Additional options for react-barcode
 * @returns An SVG HTML string
 */
export async function generateBarcodeHTML(
  text: string,
  options?: any,
): Promise<string> {
  if (typeof window === "undefined" || !text) return "";

  try {
    // Dynamically import to prevent Webpack SSR issues with jsbarcode's node/canvas dependencies
    // @ts-ignore
    const JsBarcodeModule = await import("jsbarcode");
    const JsBarcode = JsBarcodeModule.default || JsBarcodeModule;

    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      height: 40,
      margin: 0,
      ...options,
    });

    const dataUrl = canvas.toDataURL("image/png");
    return `<img src="${dataUrl}" alt="Barcode" style="max-width: 100%; height: 30px; object-fit: contain;" />`;
  } catch (error) {
    console.error("Error generating barcode image:", error);
    return "";
  }
}
