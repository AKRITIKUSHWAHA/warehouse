import React from 'react';
import { qrcode } from '../../utils/qrcode';

// Standard Code 39 9-bit encoding table (5 bars, 4 spaces; 1 = wide, 0 = narrow)
const CODE39_CHARS = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
};

export const BarcodeVisual = ({ value = "KERS10419283", height = 48, showText = true }) => {
  // Build authentic Code 39 bar/space sequence
  const { bars, totalWidth } = React.useMemo(() => {
    // Sanitize string for Code 39
    const cleanStr = String(value || 'KERS1000')
      .toUpperCase()
      .replace(/[^0-9A-Z\-.$/+% ]/g, '-');

    // Add start and stop asterisks
    const fullCode = `*${cleanStr}*`;
    const elements = []; // { isBar: boolean, width: number }
    const narrowW = 1.6;
    const wideW = 3.8;
    const gapW = 1.6; // inter-character gap

    // Quiet zone left (10 narrow units)
    let currentPos = narrowW * 6;

    for (let i = 0; i < fullCode.length; i++) {
      const char = fullCode[i];
      const pattern = CODE39_CHARS[char] || CODE39_CHARS['-'];

      for (let bitIdx = 0; bitIdx < 9; bitIdx++) {
        const isBar = bitIdx % 2 === 0;
        const isWide = pattern[bitIdx] === '1';
        const w = isWide ? wideW : narrowW;

        if (isBar) {
          elements.push({ x: currentPos, width: w });
        }
        currentPos += w;
      }

      // Add inter-character gap except after the last stop asterisk
      if (i < fullCode.length - 1) {
        currentPos += gapW;
      }
    }

    currentPos += narrowW * 6; // Quiet zone right
    return { bars: elements, totalWidth: Math.ceil(currentPos) };
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        shapeRendering="crispEdges"
        style={{ display: 'block', maxWidth: '100%' }}
      >
        <rect width={totalWidth} height={height} fill="#FFFFFF" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y="0"
            width={bar.width}
            height={height}
            fill="#000000"
          />
        ))}
      </svg>
      {showText && (
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          marginTop: '3px',
          color: '#000000'
        }}>
          *{value}*
        </span>
      )}
    </div>
  );
};

export const QrVisual = ({ value = "VI-LOGISTICS-QR", size = 80, margin = 2 }) => {
  // Generate authentic, 100% scannable ISO/IEC 18004 QR Code Matrix
  const qr = React.useMemo(() => {
    try {
      const text = String(value || 'VI-LOGISTICS-QR');
      // Version 0 auto-detects optimal size, Level 'M' gives 15% error correction
      const q = qrcode(0, 'M');
      q.addData(text);
      q.make();
      return q;
    } catch {
      try {
        const q = qrcode(0, 'L');
        q.addData(String(value || 'VI-LOGISTICS-QR'));
        q.make();
        return q;
      } catch (err2) {
        console.error('QR code generation failed:', err2);
        return null;
      }
    }
  }, [value]);

  if (!qr) {
    return (
      <div style={{
        width: size,
        height: size,
        background: '#F8FAFC',
        border: '1px solid #CBD5E1',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.65rem',
        color: '#64748B'
      }}>
        QR
      </div>
    );
  }

  const moduleCount = qr.getModuleCount();
  const totalGrid = moduleCount + (margin * 2);

  // Pre-calculate dark modules with margin offset
  const cells = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) {
        cells.push({ x: c + margin, y: r + margin });
      }
    }
  }

  return (
    <div
      title={`Scannable QR: ${value}`}
      style={{
        display: 'inline-flex',
        padding: '3px',
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${totalGrid} ${totalGrid}`}
        shapeRendering="crispEdges"
        style={{ display: 'block' }}
      >
        <rect width={totalGrid} height={totalGrid} fill="#FFFFFF" />
        {cells.map((cell, idx) => (
          <rect
            key={idx}
            x={cell.x}
            y={cell.y}
            width={1}
            height={1}
            fill="#000000"
          />
        ))}
      </svg>
    </div>
  );
};
