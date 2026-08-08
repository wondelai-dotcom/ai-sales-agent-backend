import PDFDocument from "pdfkit";

interface QuotePdfInput {
  companyName: string;
  clientName: string;
  numero: string;
  items: { descrizione: string; quantita: number; prezzoUnitario: number }[];
  taxRate: number;
  data: Date;
}

export function generateQuotePdf(input: QuotePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(input.companyName, { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666666").text(`Preventivo n. ${input.numero}`);
    doc.text(`Data: ${input.data.toLocaleDateString("it-IT")}`);
    doc.moveDown(1.5);

    doc.fillColor("#000000").fontSize(12).text(`Cliente: ${input.clientName}`);
    doc.moveDown(1);

    doc.fontSize(11);
    let subtotal = 0;
    input.items.forEach((item) => {
      const rigaTotale = item.quantita * item.prezzoUnitario;
      subtotal += rigaTotale;
      doc.text(`${item.descrizione}  (${item.quantita} x € ${item.prezzoUnitario.toFixed(2)})`, { continued: true });
      doc.text(`€ ${rigaTotale.toFixed(2)}`, { align: "right" });
    });

    const taxAmount = subtotal * (input.taxRate / 100);
    const totale = subtotal + taxAmount;

    doc.moveDown(0.5);
    doc.text("Imponibile", { continued: true });
    doc.text(`€ ${subtotal.toFixed(2)}`, { align: "right" });
    doc.text(`IVA (${input.taxRate}%)`, { continued: true });
    doc.text(`€ ${taxAmount.toFixed(2)}`, { align: "right" });

    doc.moveDown(0.3);
    doc.fontSize(13).text("Totale", { continued: true });
    doc.text(`€ ${totale.toFixed(2)}`, { align: "right" });

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#999999").text(
      "Preventivo generato automaticamente da AI Sales Agent Pro. Valido 30 giorni dalla data di emissione salvo diversa indicazione.",
      { align: "left" }
    );

    doc.end();
  });
}
