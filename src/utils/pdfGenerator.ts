import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Invoice } from '../types/invoice';
import ReactDOM from 'react-dom';
import React from 'react';
import InvoicePreviewPDF from '../components/InvoicePreviewPDF';

interface GeneratePDFOptions {
  invoice: Invoice;
  elementId: string;
}

export class PDFGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PDFGenerationError';
  }
}

export async function generateInvoicePDF({ invoice }: GeneratePDFOptions): Promise<Blob> {
  try {
    // Create a temporary container for the PDF preview
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px'; // Fixed width for consistent rendering
    container.style.background = '#ffffff';
    document.body.appendChild(container);

    // Render the PDF preview component
    ReactDOM.render(React.createElement(InvoicePreviewPDF, { invoice }), container);

    // Wait for images and signature to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Capture the preview as canvas with higher quality settings
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Ensure signature is visible in cloned document
        const signatureImg = clonedDoc.querySelector('.signature-preview img');
        if (signatureImg instanceof HTMLImageElement) {
          signatureImg.style.display = 'block';
          signatureImg.style.visibility = 'visible';
        }
      }
    });

    // Clean up the temporary container
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);

    // Calculate dimensions to fit A4
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add canvas content to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Add metadata
    pdf.setProperties({
      title: `Facture ${invoice.number}`,
      subject: `Facture pour ${invoice.client.name}`,
      author: invoice.company.name,
      keywords: 'facture, invoice',
      creator: 'Invoice Generator Pro'
    });

    // Add footer with page number
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      pdf.text(
        `Page ${i} sur ${pageCount}`,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Return as blob
    return pdf.output('blob');
  } catch (error) {
    if (error instanceof PDFGenerationError) {
      throw error;
    }
    throw new PDFGenerationError(
      error instanceof Error ? error.message : 'Failed to generate PDF'
    );
  }
}