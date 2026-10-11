import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker using Vite asset URL
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Extracts raw text from uploaded files (PDFs, plain text, markdown).
 * Handles errors gracefully so file uploads never fail.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Plain text / Markdown / CSV / JSON
  if (
    file.type.startsWith('text/') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.json')
  ) {
    try {
      const text = await file.text();
      return text.trim();
    } catch (err) {
      console.warn('Error reading text file:', err);
      return '';
    }
  }

  // 2. PDF Document
  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
      });

      const pdf = await loadingTask.promise;
      const maxPages = Math.min(pdf.numPages, 100); // Parse up to 100 pages
      const extractedPages: string[] = [];

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => (item && 'str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageText) {
          extractedPages.push(`[Page ${i}]\n${pageText}`);
        }
      }

      return extractedPages.join('\n\n');
    } catch (err) {
      console.warn('Error extracting text from PDF:', err);
      return `[PDF Document: ${file.name}]`;
    }
  }

  // 3. Image slides (PNG, JPG, etc.)
  if (file.type.startsWith('image/') || fileName.match(/\.(png|jpe?g|webp|gif|svg)$/)) {
    return `[Image Slide / Specimen: ${file.name}]`;
  }

  return `[Uploaded File: ${file.name}]`;
}
