// Minimal ambient type declarations for 'jspdf' to unblock TS during install issues.
// Remove this file once '@types/jspdf' or 'jspdf' is installed properly.

declare module 'jspdf' {
  // The library exports a class named 'jsPDF' and also a default export of the same
  export class jsPDF {
    constructor(options?: any);
    internal: any;
    setFont(fontName?: string, fontStyle?: string): this;
    setFontSize(size: number): this;
    text(text: string | string[], x: number, y: number, options?: any): this;
    addPage(format?: string | string[], orientation?: string): this;
    line(x1: number, y1: number, x2: number, y2: number): this;
    setDrawColor(r: number, g?: number, b?: number): this;
    splitTextToSize(text: string, maxSize: number): string[];
    save(filename?: string): void;
    // Size helpers
    getTextDimensions?(text: string | string[]): { w: number; h: number };
  }

  export default jsPDF;
}