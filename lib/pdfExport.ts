/**
 * Exports an HTML element to PDF with section-aware page splitting.
 * Content is never cut mid-section; sections that would overflow are moved to the next page.
 */
export async function exportToPdf(
  element: HTMLElement,
  options: {
    filename: string;
    scale?: number;
    maxPages?: number;
  }
): Promise<void> {
  const { filename, scale = 2, maxPages = 10 } = options;

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: "#f9fafb",
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pdfW = 210;
  const pdfPageH = 297;
  const imgH = (canvas.height * pdfW) / canvas.width;
  const pageHeightPx = (canvas.height * pdfPageH) / imgH;

  // Collect safe split points (tops and bottoms of sections)
  const sections = element.querySelectorAll("[data-pdf-section]");
  const splitPoints = new Set<number>([0, canvas.height]);

  sections.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const containerRect = element.getBoundingClientRect();
    const top = (rect.top - containerRect.top) * scale;
    const bottom = top + rect.height * scale;
    splitPoints.add(Math.round(top));
    splitPoints.add(Math.round(bottom));
  });

  // Add page boundaries as fallback (for sections taller than one page)
  for (let y = 0; y <= canvas.height; y += pageHeightPx) {
    splitPoints.add(Math.round(y));
  }
  splitPoints.add(canvas.height);

  const sorted = Array.from(splitPoints).sort((a, b) => a - b);

  let startY = 0;
  let pageCount = 0;

  while (startY < canvas.height && pageCount < maxPages) {
    const pageEndY = startY + pageHeightPx;

    // Find the largest split point <= pageEndY (so we don't cut through a section)
    let endY = startY;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] <= pageEndY && sorted[i] > startY) {
        endY = sorted[i];
      } else if (sorted[i] > pageEndY) {
        break;
      }
    }

    // If no section boundary in range, use page boundary (avoids infinitely tall chunk)
    if (endY <= startY) {
      endY = Math.min(pageEndY, canvas.height);
    }

    const chunkHeight = Math.min(endY - startY, canvas.height - startY);

    // Extract this chunk from the canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = chunkHeight;
    const ctx = tempCanvas.getContext("2d")!;
    ctx.drawImage(canvas, 0, startY, canvas.width, chunkHeight, 0, 0, canvas.width, chunkHeight);

    const chunkImgData = tempCanvas.toDataURL("image/jpeg", 0.95);
    const chunkImgH = (chunkHeight * pdfW) / canvas.width;

    if (pageCount > 0) {
      pdf.addPage();
    }
    pdf.addImage(chunkImgData, "JPEG", 0, 0, pdfW, chunkImgH);

    startY = endY;
    pageCount++;
  }

  pdf.save(filename);
}
