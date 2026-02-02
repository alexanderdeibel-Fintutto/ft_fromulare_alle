/**
 * PDF Print Optimizer
 * Zentrale Klasse für optimierte PDF-Generierung mit druckoptimierten Einstellungen
 */

export class PDFPrintOptimizer {
  constructor(pdf) {
    this.pdf = pdf;
    this.pageWidth = pdf.internal.pageSize.getWidth();
    this.pageHeight = pdf.internal.pageSize.getHeight();
    
    // Druckoptimierte Abstände
    this.margins = { top: 15, bottom: 15, left: 15, right: 15 };
    this.contentWidth = this.pageWidth - (this.margins.left + this.margins.right);
    this.currentY = this.margins.top;
    this.minSpaceForNewPage = 40;
  }

  // Automatische Seitenumbruch-Verwaltung
  checkPageBreak(spaceNeeded = 20) {
    if (this.currentY + spaceNeeded > this.pageHeight - this.margins.bottom) {
      this.addNewPage();
      return true;
    }
    return false;
  }

  addNewPage() {
    this.pdf.addPage();
    this.currentY = this.margins.top;
  }

  // Header mit Logo und Unternehmensinformationen
  addPrintHeader(headerConfig = {}) {
    const { 
      imageUrl, 
      imageName = 'PNG', 
      imageHeight = 20,
      title,
      subtitle,
      date,
      referenceNumber
    } = headerConfig;

    this.checkPageBreak(imageHeight + 30);

    // Logo/Bild
    if (imageUrl) {
      try {
        this.pdf.addImage(
          imageUrl,
          imageName,
          this.margins.left,
          this.currentY,
          40,
          imageHeight
        );
      } catch (e) {
        console.warn('Header image failed:', e);
      }
    }

    // Titel und Metadaten rechts ausgerichtet
    this.pdf.setFontSize(18);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text(
      title || 'Dokument',
      this.pageWidth - this.margins.right,
      this.currentY + 5,
      { align: 'right' }
    );

    if (subtitle) {
      this.pdf.setFontSize(10);
      this.pdf.setFont(undefined, 'normal');
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text(
        subtitle,
        this.pageWidth - this.margins.right,
        this.currentY + 12,
        { align: 'right' }
      );
    }

    // Referenznummern und Datum
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(120, 120, 120);
    let refY = this.currentY + imageHeight + 5;

    if (referenceNumber) {
      this.pdf.text(`Referenz: ${referenceNumber}`, this.margins.left, refY);
      refY += 5;
    }

    if (date) {
      this.pdf.text(`Datum: ${date}`, this.margins.left, refY);
    }

    this.pdf.setTextColor(0, 0, 0);
    this.currentY += imageHeight + 20;
  }

  // Druckoptimierte Tabelle
  addTable(columns, rows, options = {}) {
    const { rowHeight = 8, headerBg = [245, 245, 245], alternateRows = true } = options;

    this.checkPageBreak(columns.length * rowHeight + 20);

    const colWidths = this.contentWidth / columns.length;
    let tableY = this.currentY;

    // Header
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setFontSize(10);
    this.pdf.setFillColor(...headerBg);

    columns.forEach((col, i) => {
      this.pdf.rect(
        this.margins.left + i * colWidths,
        tableY,
        colWidths,
        rowHeight,
        'F'
      );
      this.pdf.text(
        col,
        this.margins.left + i * colWidths + 2,
        tableY + rowHeight - 2,
        { maxWidth: colWidths - 4 }
      );
    });

    tableY += rowHeight;

    // Rows
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setFontSize(9);

    rows.forEach((row, rowIdx) => {
      if (tableY + rowHeight > this.pageHeight - this.margins.bottom) {
        this.addNewPage();
        tableY = this.margins.top;
      }

      // Zeilenhintergrund
      if (alternateRows && rowIdx % 2 === 0) {
        this.pdf.setFillColor(250, 250, 250);
        this.pdf.rect(
          this.margins.left,
          tableY,
          this.contentWidth,
          rowHeight,
          'F'
        );
      }

      // Zellenwerte
      row.forEach((cell, colIdx) => {
        this.pdf.text(
          String(cell || ''),
          this.margins.left + colIdx * colWidths + 2,
          tableY + rowHeight - 2,
          { maxWidth: colWidths - 4 }
        );
      });

      tableY += rowHeight;
    });

    this.currentY = tableY + 5;
  }

  // Abschnitt mit Titel
  addSection(title, content = null) {
    this.checkPageBreak(15);

    // Abschnittstitel
    this.pdf.setFontSize(12);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(40, 40, 100);
    this.pdf.text(title, this.margins.left, this.currentY);
    
    // Trennlinie
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(
      this.margins.left,
      this.currentY + 2,
      this.pageWidth - this.margins.right,
      this.currentY + 2
    );

    this.currentY += 8;
    this.pdf.setTextColor(0, 0, 0);

    if (content) {
      this.addText(content);
    }
  }

  // Formularfeld (Label + Wert)
  addFormField(label, value, options = {}) {
    const { inline = false, boxed = false } = options;

    this.checkPageBreak(8);

    this.pdf.setFontSize(9);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(60, 60, 60);

    if (inline) {
      // Inline: Label und Wert in einer Zeile
      this.pdf.text(`${label}:`, this.margins.left, this.currentY);
      this.pdf.setFont(undefined, 'normal');
      this.pdf.text(String(value || ''), this.margins.left + 60, this.currentY);
      this.currentY += 6;
    } else {
      // Block: Label über Wert
      this.pdf.text(label, this.margins.left, this.currentY);
      this.currentY += 5;

      this.pdf.setFont(undefined, 'normal');
      this.pdf.setFontSize(10);

      if (boxed) {
        // Wert in Box
        this.pdf.setFillColor(248, 248, 248);
        this.pdf.rect(
          this.margins.left,
          this.currentY - 3,
          this.contentWidth,
          8,
          'F'
        );
      }

      const lines = this.pdf.splitTextToSize(String(value || ''), this.contentWidth);
      this.pdf.text(lines, this.margins.left + 2, this.currentY);
      this.currentY += Math.max(10, lines.length * 5) + 2;
    }

    this.pdf.setTextColor(0, 0, 0);
  }

  // Text mit automatischem Umbruch
  addText(text, fontSize = 10, options = {}) {
    const { bold = false, color = [0, 0, 0] } = options;

    this.checkPageBreak(15);

    this.pdf.setFontSize(fontSize);
    this.pdf.setFont(undefined, bold ? 'bold' : 'normal');
    this.pdf.setTextColor(...color);

    const lines = this.pdf.splitTextToSize(text, this.contentWidth);
    this.pdf.text(lines, this.margins.left, this.currentY);

    this.currentY += lines.length * (fontSize / 3) + 3;
  }

  // Unterschriftenlinie
  addSignatureLine(label, includeDate = true) {
    this.checkPageBreak(15);

    const lineY = this.currentY + 15;
    const lineLength = 45;

    // Signaturlinie
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.line(
      this.margins.left,
      lineY,
      this.margins.left + lineLength,
      lineY
    );

    // Label unter der Linie
    this.pdf.setFontSize(8);
    this.pdf.text(label, this.margins.left, lineY + 5);

    // Datum rechts
    if (includeDate) {
      this.pdf.line(
        this.pageWidth - this.margins.right - lineLength,
        lineY,
        this.pageWidth - this.margins.right,
        lineY
      );
      this.pdf.text('Datum', this.pageWidth - this.margins.right - lineLength, lineY + 5);
    }

    this.currentY += 25;
  }

  // Footer auf allen Seiten
  addFooter(text, options = {}) {
    const { pageNumbers = true, lineAbove = true } = options;

    const pages = this.pdf.getNumberOfPages();

    for (let i = 1; i <= pages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(150, 150, 150);

      if (lineAbove) {
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.line(
          this.margins.left,
          this.pageHeight - this.margins.bottom - 8,
          this.pageWidth - this.margins.right,
          this.pageHeight - this.margins.bottom - 8
        );
      }

      if (text) {
        this.pdf.text(text, this.margins.left, this.pageHeight - this.margins.bottom + 2);
      }

      if (pageNumbers) {
        this.pdf.text(
          `Seite ${i} von ${pages}`,
          this.pageWidth - this.margins.right - 20,
          this.pageHeight - this.margins.bottom + 2,
          { align: 'right' }
        );
      }
    }

    this.pdf.setTextColor(0, 0, 0);
  }

  // DRAFT Watermark
  addDraftWatermark() {
    const pages = this.pdf.getNumberOfPages();

    for (let i = 1; i <= pages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(60);
      this.pdf.setTextColor(200, 200, 200);
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text('ENTWURF', this.pageWidth / 2, this.pageHeight / 2, {
        align: 'center',
        angle: 45
      });
      this.pdf.setTextColor(0, 0, 0);
    }
  }

  // PDF zurückgeben
  getBlob() {
    return this.pdf.output('blob');
  }

  getDataUrl() {
    return this.pdf.output('datauristring');
  }
}