import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.jpg";
import { factureService } from "../services/api";

// ===== CONSTRUCTION DU PDF (fonction commune) =====
const construirePDF = async facture => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Charger le logo
  const getLogoBase64 = () => {
    return new Promise(resolve => {
      const img = new Image();
      img.src = logo;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
    });
  };

  const logoBase64 = await getLogoBase64();

  // EN-TÊTE
  doc.setFillColor(30, 78, 121);
  doc.rect(0, 0, pageWidth, 55, "F");
  doc.addImage(logoBase64, "JPEG", 10, 8, 32, 32);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SMART NDIYAM", 48, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Système Intelligent de Gestion d'Eau IoT", 48, 28);
  doc.text("Sénégal | contact@smartndiyam.sn", 48, 35);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(
    `FACTURE #${String(facture.id).padStart(4, "0")}`,
    pageWidth - 15,
    18,
    { align: "right" }
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 255);
  doc.text(
    `Émise le : ${new Date(facture.date_generation).toLocaleDateString("fr-FR")}`,
    pageWidth - 15,
    27,
    { align: "right" }
  );

  doc.setTextColor(255, 180, 100);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Échéance : ${new Date(facture.date_limite).toLocaleDateString("fr-FR")}`,
    pageWidth - 15,
    35,
    { align: "right" }
  );

  doc.setTextColor(255, 220, 100);
  doc.setFontSize(10);
  doc.text(`Période : ${facture.periode_label || "N/A"}`, pageWidth - 15, 44, {
    align: "right",
  });

  // STATUT
  const statutColors = {
    payee: [34, 197, 94],
    en_retard: [239, 68, 68],
    en_attente: [234, 179, 8],
  };
  const statutLabels = {
    payee: "PAYEE",
    en_retard: "EN RETARD",
    en_attente: "EN ATTENTE",
  };

  doc.setFillColor(...(statutColors[facture.statut] || [234, 179, 8]));
  doc.roundedRect(14, 44, 48, 9, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(statutLabels[facture.statut] || facture.statut, 38, 50, {
    align: "center",
  });

  // INFOS CLIENT
  let currentY = 65;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS CLIENT", 15, currentY);
  doc.setDrawColor(30, 78, 121);
  doc.setLineWidth(0.5);
  doc.line(15, currentY + 2, pageWidth - 15, currentY + 2);

  const client = facture.client_detail;
  if (client) {
    currentY += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 78, 121);
    doc.text(
      `${client.first_name || ""} ${client.last_name || ""}`,
      15,
      currentY
    );
    currentY += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`Zone : ${client.zone || "N/A"}`, 15, currentY);
    currentY += 7;
    doc.text(`Email : ${client.email || "N/A"}`, 15, currentY);
    currentY += 7;
    doc.text(`Téléphone : ${client.telephone || "N/A"}`, 15, currentY);
    if (client.adresse) {
      currentY += 7;
      doc.text(`Adresse : ${client.adresse}`, 15, currentY);
    }
  }

  currentY += 12;

  // RELEVÉ DES INDEX
  if (facture.index_list && facture.index_list.length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RELEVÉ DES INDEX", 15, currentY);
    doc.setDrawColor(30, 78, 121);
    doc.line(15, currentY + 2, pageWidth - 15, currentY + 2);

    const nouvelIndex = facture.index_list[0];
    const ancienIndex = facture.index_list[1];
    const indexData = [];

    if (ancienIndex) {
      indexData.push([
        "Ancien index",
        `${parseFloat(ancienIndex.valeur_index).toFixed(3)} m³`,
        new Date(ancienIndex.date_releve).toLocaleDateString("fr-FR"),
      ]);
    }
    if (nouvelIndex) {
      indexData.push([
        "Nouvel index",
        `${parseFloat(nouvelIndex.valeur_index).toFixed(3)} m³`,
        new Date(nouvelIndex.date_releve).toLocaleDateString("fr-FR"),
      ]);
    }
    if (ancienIndex && nouvelIndex) {
      const conso = parseFloat(
        (nouvelIndex.valeur_index - ancienIndex.valeur_index).toFixed(4)
      );
      const consoLitres = (conso * 1000).toFixed(2);
      indexData.push([
        "Consommation calculée",
        `${conso} m³  =  ${consoLitres} L`,
        "",
      ]);
    }

    autoTable(doc, {
      startY: currentY + 6,
      head: [["Type", "Valeur", "Date relevé"]],
      body: indexData,
      headStyles: {
        fillColor: [46, 117, 182],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: { fontSize: 10, textColor: [60, 60, 60] },
      didParseCell: data => {
        if (
          data.row.index === indexData.length - 1 &&
          ancienIndex &&
          nouvelIndex
        ) {
          data.cell.styles.fillColor = [210, 230, 252];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [30, 78, 121];
        }
      },
      alternateRowStyles: { fillColor: [240, 248, 255] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 75 },
        2: { cellWidth: 50 },
      },
      margin: { left: 15, right: 15 },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // DÉTAILS FACTURE
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAILS DE LA FACTURE", 15, currentY);
  doc.setDrawColor(30, 78, 121);
  doc.line(15, currentY + 2, pageWidth - 15, currentY + 2);

  autoTable(doc, {
    startY: currentY + 6,
    head: [["Description", "Volume", "Prix unitaire", "Montant"]],
    body: [
      [
        "Consommation d'eau potable",
        `${facture.volume_total} L`,
        facture.tarif_detail ? "Voir détail tranches ci-dessus" : "N/A",
        `${facture.montant?.toLocaleString("fr-FR")} FCFA`,
      ],
    ],
    headStyles: {
      fillColor: [30, 78, 121],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10, textColor: [60, 60, 60] },
    alternateRowStyles: { fillColor: [240, 248, 255] },
    margin: { left: 15, right: 15 },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // TARIFICATION PAR TRANCHES
  if (facture.tarif_detail) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 78, 121);
    doc.text("Tarification par tranches :", 15, currentY);
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(
      `Tranche sociale    (0 - 20 m³)  : ${facture.tarif_detail.prix_ts} FCFA/m³`,
      20,
      currentY
    );
    currentY += 5;
    doc.text(
      `Tranche progressive (21 - 40 m³) : ${facture.tarif_detail.prix_tp} FCFA/m³`,
      20,
      currentY
    );
    currentY += 5;
    doc.text(
      `Tranche dissuasive  (> 40 m³)    : ${facture.tarif_detail.prix_td} FCFA/m³`,
      20,
      currentY
    );
    currentY += 10;
  }

  // TOTAL
  doc.setFillColor(30, 78, 121);
  doc.rect(pageWidth - 85, currentY, 70, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("MONTANT TOTAL :", pageWidth - 80, currentY + 9);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${facture.montant?.toLocaleString("fr-FR")} FCFA`,
    pageWidth - 17,
    currentY + 18,
    { align: "right" }
  );

  currentY += 30;

  // MODE PAIEMENT si payée
  if (facture.statut === "payee" && facture.mode_paiement) {
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(15, currentY, 95, 18, 3, 3, "F");
    doc.setDrawColor(34, 197, 94);
    doc.roundedRect(15, currentY, 95, 18, 3, 3);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text("Paiement reçu via :", 20, currentY + 7);
    doc.setFont("helvetica", "normal");
    const modeLabels = {
      wave: "Wave",
      orange_money: "Orange Money",
      agence: "Agence physique",
    };
    doc.text(
      modeLabels[facture.mode_paiement] || facture.mode_paiement,
      20,
      currentY + 14
    );
    currentY += 25;
  }

  // MODES DE PAIEMENT
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("MODES DE PAIEMENT ACCEPTÉS", 15, currentY);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, currentY + 2, pageWidth - 15, currentY + 2);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(
    "• Wave : Envoyez le montant au numéro de votre agence",
    20,
    currentY + 10
  );
  doc.text(
    "• Orange Money : Envoyez le montant au numéro de votre agence",
    20,
    currentY + 17
  );
  doc.text(
    "• Agence : Payez directement à l'agence SEN'EAU de votre zone",
    20,
    currentY + 24
  );

  // PIED DE PAGE
  const footerY = doc.internal.pageSize.getHeight() - 18;
  doc.setFillColor(30, 78, 121);
  doc.rect(0, footerY - 3, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Smart Ndiyam - Système Intelligent de Gestion d'Eau IoT | Sénégal",
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );
  doc.text(
    `Document généré le ${new Date().toLocaleString("fr-FR")}`,
    pageWidth / 2,
    footerY + 11,
    { align: "center" }
  );

  return doc;
};

// ===== FONCTION 1 : Visualiser seulement (bouton PDF dans liste) =====
export const visualiserFacturePDF = async facture => {
  const doc = await construirePDF(facture);
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

// ===== FONCTION 2 : Générer + envoyer par email (lors de la génération) =====
export const genererEtEnvoyerPDF = async facture => {
  const doc = await construirePDF(facture);

  // Visualiser dans nouvel onglet
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");

  // Envoyer par email avec pièce jointe
  try {
    const pdfBase64 = doc.output("datauristring").split(",")[1];
    await factureService.envoyerPDF(facture.id, pdfBase64);
    console.log("PDF envoyé par email au client !");
  } catch (error) {
    console.error("Erreur envoi email PDF:", error.response?.data || error);
  }
};

// Export par défaut pour compatibilité
export const genererFacturePDF = visualiserFacturePDF;

// ===== FONCTION 3 : Juste envoyer par email (sans ouvrir onglet) =====
export const envoyerPDFParEmail = async facture => {
  const doc = await construirePDF(facture);
  try {
    const pdfBase64 = doc.output("datauristring").split(",")[1];
    await factureService.envoyerPDF(facture.id, pdfBase64);
    console.log(`PDF envoyé à ${facture.client_detail?.email}`);
  } catch (error) {
    console.error("Erreur envoi email PDF:", error);
  }
};
