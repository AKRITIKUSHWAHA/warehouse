import React, { useState } from 'react';
import { X, Printer, Download, Check } from 'lucide-react';
import { CargoLabel4x6 } from '../documents/CargoLabel4x6';
import { useToast } from '../../context/ToastContext';

export const CargoLabelModal = ({ isOpen, onClose, cargo }) => {
  const { showToast } = useToast();
  const [pieceIndex, setPieceIndex] = useState(1);
  const totalPieces = cargo?.totalPieces || cargo?.packageCount || 1;

  if (!isOpen || !cargo) return null;

  const handlePrint = () => {
    const labelEl = document.querySelector('.modal-body .printable-label-4x6');
    if (!labelEl) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cargo Label - ${cargo?.receiptNumber || cargo?.id || '4x6'}</title>
          <style>
            @page {
              size: 4in 6in;
              margin: 0.08in;
            }
            * {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
              height: 100% !important;
              overflow: hidden !important;
              display: flex !important;
              justify-content: center !important;
              align-items: flex-start !important;
              font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
            }
            .printable-label-4x6 {
              width: 3.84in !important;
              max-height: 5.84in !important;
              min-height: unset !important;
              box-sizing: border-box !important;
              border: 3.5px solid #000000 !important;
              box-shadow: none !important;
              margin: 0 auto !important;
              padding: 0.4rem 0.6rem 0.35rem 0.6rem !important;
              background: #ffffff !important;
              color: #000000 !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
              zoom: 0.80 !important;
            }
            .printable-label-4x6 * {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .printable-label-4x6 > div:first-child > div {
              margin-bottom: 0.3rem !important;
            }
            .printable-label-4x6 > div:first-child > div:last-child {
              margin-bottom: 0.2rem !important;
            }
            .printable-label-4x6 > div:last-child > div:first-child {
              margin-bottom: 0.2rem !important;
            }
            .printable-label-4x6 > div:last-child > div:last-child {
              padding-top: 0.35rem !important;
            }
            svg {
              display: block;
            }
            img {
              max-width: 100%;
            }
          </style>
        </head>
        <body>
          ${labelEl.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 250);

    showToast(`Print job sent for Cargo Label ${cargo.id || cargo.receiptNumber}.`, 'success', 'Print Started');
  };

  return (
    <div className="modal-backdrop print-label-modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Printer size={20} style={{ color: '#0284C7' }} />
            <span>Cargo Label Preview (4" × 6" Thermal Roll)</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ background: '#F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          {totalPieces > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#FFFFFF', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                Select Piece Label:
              </span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {Array.from({ length: Math.min(totalPieces, 8) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPieceIndex(idx + 1)}
                    className={`btn btn-sm ${pieceIndex === idx + 1 ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    Piece {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '1rem', background: '#E2E8F0', borderRadius: '12px', overflowX: 'auto', maxWidth: '100%' }}>
            <CargoLabel4x6
              cargo={cargo}
              pieceIndex={pieceIndex}
              totalPieces={totalPieces}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print 4x6 Label</span>
          </button>
        </div>
      </div>
    </div>
  );
};
