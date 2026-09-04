/* =====================================================================
   Marafa Operations Portal — receipt.js
   Builds a branded receipt for a sale, exports it as PNG/PDF, and
   offers WhatsApp / Email / native-share options.
===================================================================== */

function receiptNo(sale) {
  return sale.receipt_no || ("RCT-" + String(sale.id).padStart(5, "0"));
}

function receiptCardHtml(sale, company, issuedBy) {
  const isPaid = sale.status === "Paid";
  return `
    <div id="receiptCard" style="width:420px;background:#fff;font-family:'Work Sans',sans-serif;color:#141a17;padding:0;position:relative;overflow:hidden;border:1px solid #e2ece8;">
      <div style="background:#0f2a4a;padding:22px 26px;color:#fff;display:flex;align-items:center;gap:12px;">
        <div style="width:38px;height:38px;border-radius:9px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:4px;">
          <img src="../assets/logo.png" alt="logo" style="width:100%;height:100%;object-fit:contain;display:block;">
        </div>
        <div>
          <div style="font-family:'Arvo',serif;font-weight:700;font-size:14px;">${esc(company.name)}</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;color:#63c060;margin-top:2px;">RC ${esc(company.rc)}</div>
        </div>
      </div>
      <div style="padding:24px 26px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
          <div>
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;color:#94a3b8;text-transform:uppercase;">Receipt No.</div>
            <div style="font-weight:700;font-size:14px;">${esc(receiptNo(sale))}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;color:#94a3b8;text-transform:uppercase;">Date</div>
            <div style="font-weight:600;font-size:13px;">${esc(sale.sale_date || sale.date || "—")}</div>
          </div>
        </div>
        <div style="border-top:1px dashed #d6e3df;border-bottom:1px dashed #d6e3df;padding:16px 0;margin-bottom:16px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;">Received From / Client</div>
          <div style="font-weight:700;font-size:15px;margin-bottom:14px;">${esc(sale.client) || "—"}</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;">For</div>
          <div style="font-size:13.5px;">${esc(sale.description)}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.08em;color:#64748b;text-transform:uppercase;">Amount</div>
          <div style="font-weight:700;font-size:22px;color:#0f2a4a;">${fmtNaira(sale.amount)}</div>
        </div>
        ${issuedBy ? `<div style="font-size:11.5px;color:#94a3b8;margin-top:10px;">Issued by: ${esc(issuedBy)}</div>` : ""}
        <div style="margin-top:18px;text-align:center;">
          <span style="display:inline-block;padding:8px 22px;border-radius:99px;font-weight:700;font-size:13px;letter-spacing:.06em;background:${isPaid ? "#d1fae5" : "#fef3c7"};color:${isPaid ? "#047857" : "#b45309"};border:2px solid ${isPaid ? "#047857" : "#b45309"};">
            ${isPaid ? "PAID" : "UNPAID"}
          </span>
        </div>
      </div>
      <div style="background:#eef4f1;padding:12px 26px;text-align:center;font-size:11px;color:#4c554f;">
        ${esc(company.address)}<br>${esc(company.phone)} &middot; ${esc(company.email)}
      </div>
    </div>`;
}

async function renderToCanvas(container) {
  return await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
}

async function downloadReceiptImage(sale, company, issuedBy) {
  const holder = document.createElement("div");
  holder.style.position = "fixed"; holder.style.left = "-9999px";
  holder.innerHTML = receiptCardHtml(sale, company, issuedBy);
  document.body.appendChild(holder);
  const canvas = await renderToCanvas(holder.firstElementChild);
  holder.remove();
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${receiptNo(sale)}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}

async function downloadReceiptPDF(sale, company, issuedBy) {
  const holder = document.createElement("div");
  holder.style.position = "fixed"; holder.style.left = "-9999px";
  holder.innerHTML = receiptCardHtml(sale, company, issuedBy);
  document.body.appendChild(holder);
  const canvas = await renderToCanvas(holder.firstElementChild);
  holder.remove();
  const { jsPDF } = window.jspdf;
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "px", format: [canvas.width / 2 + 40, canvas.height / 2 + 40] });
  pdf.addImage(imgData, "PNG", 20, 20, canvas.width / 2, canvas.height / 2);
  pdf.save(`${receiptNo(sale)}.pdf`);
}

async function getReceiptBlob(sale, company, issuedBy) {
  const holder = document.createElement("div");
  holder.style.position = "fixed"; holder.style.left = "-9999px";
  holder.innerHTML = receiptCardHtml(sale, company, issuedBy);
  document.body.appendChild(holder);
  const canvas = await renderToCanvas(holder.firstElementChild);
  holder.remove();
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function shareReceipt(sale, company, issuedBy) {
  const shareText = `Receipt ${receiptNo(sale)} from ${company.name}\nClient: ${sale.client || "—"}\nAmount: ${fmtNaira(sale.amount)}\nStatus: ${sale.status}`;
  const blob = await getReceiptBlob(sale, company, issuedBy);
  const file = new File([blob], `${receiptNo(sale)}.png`, { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Receipt ${receiptNo(sale)}`, text: shareText });
      return;
    } catch (e) { /* user cancelled or failed — fall through to manual options */ }
  }
  openManualShareOptions(sale, shareText, blob);
}

function openManualShareOptions(sale, shareText, blob) {
  const url = URL.createObjectURL(blob);
  const waLink = "https://wa.me/?text=" + encodeURIComponent(shareText);
  const mailLink = "mailto:?subject=" + encodeURIComponent("Receipt " + receiptNo(sale)) + "&body=" + encodeURIComponent(shareText);
  const modal = openModal("Share Receipt", `
    <p style="font-size:13.5px;color:#64748b;line-height:1.6;margin-top:0;">
      Your browser can't attach the receipt image directly to WhatsApp or Email from here.
      First download the image, then attach it manually in the app that opens.
    </p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <a href="${url}" download="${receiptNo(sale)}.png" class="btn-add" style="text-align:center;text-decoration:none;">⬇ Download Receipt Image</a>
      <a href="${waLink}" target="_blank" rel="noopener" class="btn-outline-sm" style="text-align:center;text-decoration:none;justify-content:center;">Open WhatsApp with message</a>
      <a href="${mailLink}" class="btn-outline-sm" style="text-align:center;text-decoration:none;justify-content:center;">Open Email with message</a>
    </div>
  `);
}

function printReceipt(sale, company, issuedBy) {
  const w = window.open("", "_blank", "width=500,height=700");
  w.document.write(`<html><head><title>${receiptNo(sale)}</title></head><body>${receiptCardHtml(sale, company, issuedBy)}<script>window.onload=()=>window.print();<\/script></body></html>`);
  w.document.close();
}

function openReceiptModal(sale, company, issuedBy) {
  const modal = openModal(`Receipt — ${receiptNo(sale)}`, `
    <div style="display:flex;justify-content:center;margin-bottom:20px;">${receiptCardHtml(sale, company, issuedBy)}</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
      <button class="btn-outline-sm" id="btnPng">⬇ PNG Image</button>
      <button class="btn-outline-sm" id="btnPdf">⬇ PDF</button>
      <button class="btn-outline-sm" id="btnPrint">🖨 Print</button>
      <button class="btn-add" id="btnShare">↗ Share</button>
    </div>
  `, true);
  modal.querySelector("#btnPng").addEventListener("click", () => downloadReceiptImage(sale, company, issuedBy));
  modal.querySelector("#btnPdf").addEventListener("click", () => downloadReceiptPDF(sale, company, issuedBy));
  modal.querySelector("#btnPrint").addEventListener("click", () => printReceipt(sale, company, issuedBy));
  modal.querySelector("#btnShare").addEventListener("click", () => shareReceipt(sale, company, issuedBy));
}
