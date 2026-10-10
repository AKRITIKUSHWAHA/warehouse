/**
 * High-quality client-side PDF export utility
 * Uses html2pdf.js with crisp 2x canvas scaling and letter portrait formatting.
 * Includes a pure client-side PDF fallback so a .pdf file is GUARANTEED to download
 * directly to the user's computer without opening the print dialog.
 */

export const loadHtml2Pdf = async () => {
  if (typeof window !== 'undefined' && window.html2pdf) {
    return window.html2pdf;
  }

  // 1. Poll for window.html2pdf in case the head script is already in-flight
  for (let i = 0; i < 20; i++) {
    if (typeof window !== 'undefined' && window.html2pdf) {
      return window.html2pdf;
    }
    await new Promise((r) => setTimeout(r, 60));
  }

  // 2. If not yet loaded, inject fresh script tags from CDNs
  const cdnUrls = [
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
    'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
  ];

  for (const url of cdnUrls) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          if (window.html2pdf) resolve(window.html2pdf);
          else setTimeout(() => (window.html2pdf ? resolve(window.html2pdf) : reject(new Error('Object not ready'))), 100);
        };
        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(script);
      });
      if (window.html2pdf) return window.html2pdf;
    } catch (e) {
      console.warn(`Could not load html2pdf from ${url}:`, e);
    }
  }

  if (window.html2pdf) {
    return window.html2pdf;
  }

  throw new Error('html2pdf library could not be loaded from CDNs.');
};

/**
 * Pure JavaScript builder for PDF-1.3 with an embedded JPEG image
 * Fallback when external libraries are unavailable or blocked.
 */
function buildPdfFromJpegBlob(jpegBytes, imgWidth, imgHeight, filename) {
  // Letter size in points: 612 x 792 (8.5 x 11 inches)
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 18; // 0.25 inch
  const availW = pageWidth - margin * 2;
  const availH = pageHeight - margin * 2;

  let renderW = availW;
  let renderH = (imgHeight * availW) / imgWidth;
  if (renderH > availH) {
    renderH = availH;
    renderW = (imgWidth * availH) / imgHeight;
  }

  const posX = (pageWidth - renderW) / 2;
  const posY = pageHeight - margin - renderH;

  const enc = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let byteOffset = 0;

  function pushStr(str) {
    const bytes = enc.encode(str);
    chunks.push(bytes);
    byteOffset += bytes.length;
  }

  function pushBytes(bytes) {
    chunks.push(bytes);
    byteOffset += bytes.length;
  }

  // PDF Header
  pushStr('%PDF-1.3\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  offsets.push(byteOffset);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  offsets.push(byteOffset);
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page
  offsets.push(byteOffset);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
    `/Resources << /XObject << /Im1 5 0 R >> /ProcSet [/PDF /ImageC] >> ` +
    `/Contents 4 0 R >>\nendobj\n`
  );

  // Object 4: Contents Stream
  const contentStream = `q\n${renderW.toFixed(2)} 0 0 ${renderH.toFixed(2)} ${posX.toFixed(2)} ${posY.toFixed(2)} cm\n/Im1 Do\nQ\n`;
  offsets.push(byteOffset);
  pushStr(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  // Object 5: Image XObject (JPEG stream)
  offsets.push(byteOffset);
  pushStr(
    `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} ` +
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  // XRef Table
  const startXRef = byteOffset;
  pushStr('xref\n0 6\n');
  pushStr('0000000000 65535 f \n');
  for (const off of offsets) {
    pushStr(off.toString().padStart(10, '0') + ' 00000 n \n');
  }

  // Trailer
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXRef}\n%%EOF\n`);

  // Create Blob and trigger direct browser download
  const fullBlob = new Blob(chunks, { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(fullBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 8000);
}

/**
 * Snapshot DOM element to canvas and export as PDF
 */
/**
 * Snapshot DOM element to canvas and export as PDF fallback
 */
async function exportElementViaCanvasFallback(element, filename) {
  // If html2canvas is bundled inside window.html2pdf or on window, use it directly
  const html2canvasFn = window.html2canvas || (window.html2pdf && window.html2pdf.html2canvas);

  if (typeof html2canvasFn === 'function') {
    const canvas = await html2canvasFn(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      letterRendering: true
    });
    const jpegBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.95));
    const arrayBuffer = await jpegBlob.arrayBuffer();
    const jpegBytes = new Uint8Array(arrayBuffer);
    buildPdfFromJpegBlob(jpegBytes, canvas.width, canvas.height, filename);
    return;
  }

  // Pure vector print-to-PDF trigger if canvas libraries are blocked
  const prevTitle = document.title;
  document.title = filename.replace(/\.pdf$/i, '');
  window.print();
  setTimeout(() => {
    document.title = prevTitle;
  }, 1000);
}

/**
 * Main export function called by UI buttons
 */
export const downloadPdfFromElement = async (elementOrId, filename = 'document.pdf') => {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) {
    throw new Error('Target document element not found.');
  }

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Pre-load all images so html2canvas renders them immediately without blanks
  const imgs = element.querySelectorAll('img');
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    img.crossOrigin = 'anonymous';
    if (!img.complete) {
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
        setTimeout(res, 300);
      });
    }
  }

  // Ensure runtime CSS styles pin html2pdf containers strictly to (0, 0)
  // This eliminates any screen-width centering or scroll offset horizontal shift!
  let runtimeStyle = document.getElementById('html2pdf-runtime-pin-styles');
  if (!runtimeStyle) {
    runtimeStyle = document.createElement('style');
    runtimeStyle.id = 'html2pdf-runtime-pin-styles';
    runtimeStyle.textContent = `
      .html2pdf__overlay {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        z-index: 999999 !important;
      }
      .html2pdf__container {
        position: absolute !important;
        left: 0 !important;
        right: auto !important;
        top: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 800px !important;
        max-width: 800px !important;
        background: #FFFFFF !important;
        box-sizing: border-box !important;
      }
      .html2pdf__container .printable-document-receipt {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(runtimeStyle);
  }

  // 1. Primary method: html2pdf.js with jsPDF engine
  try {
    const html2pdf = await loadHtml2Pdf();
    if (html2pdf) {
      const opt = {
        margin: [0.25, 0.25, 0.25, 0.25], // 0.25 inch borders
        filename: cleanFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait'
        }
      };

      // Pass element directly - html2pdf clones it into .html2pdf__container at (0, 0)
      await window.html2pdf().set(opt).from(element).save();
      return true;
    }
  } catch (err) {
    console.warn('html2pdf primary method failed, attempting fallback:', err);
  }

  // 2. Client-side fallback: captures element directly
  try {
    await exportElementViaCanvasFallback(element, cleanFilename);
    return true;
  } catch (fallbackErr) {
    console.error('All PDF generation methods failed:', fallbackErr);
    throw new Error(`Failed to generate PDF: ${fallbackErr.message}`);
  }
};

