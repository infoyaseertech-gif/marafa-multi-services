/* =====================================================================
   Marafa Operations Portal — receipt.js
   Builds a branded receipt for a sale, exports it as PNG/PDF, and
   offers WhatsApp / Email / native-share options.
===================================================================== */

function receiptNo(sale) {
  return sale.receipt_no || ("RCT-" + String(sale.id).padStart(5, "0"));
}

/* ---- Number to words (Naira) — gives the receipt a formal, bank-style finish ---- */
function numberToWords(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return "Zero Naira Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function chunk(n) {
    let s = "";
    if (n >= 100) { s += ones[Math.floor(n / 100)] + " Hundred"; n %= 100; if (n) s += " and "; }
    if (n >= 20) { s += tens[Math.floor(n / 10)]; if (n % 10) s += "-" + ones[n % 10]; }
    else if (n > 0) { s += ones[n]; }
    return s;
  }

  const scales = [
    [1000000000, "Billion"], [1000000, "Million"], [1000, "Thousand"], [1, ""],
  ];
  let words = "";
  let n = num;
  for (const [value, label] of scales) {
    if (n >= value) {
      const count = Math.floor(n / value);
      words += (words ? ", " : "") + chunk(count) + (label ? " " + label : "");
      n %= value;
    }
  }
  return (words || "Zero") + " Naira Only";
}

function receiptCardHtml(sale, company, issuedBy) {
  const isPaid = sale.status === "Paid";
  const statusColor = isPaid ? "#1f6d33" : "#b45309";
  const statusBg = isPaid ? "#e7f4ea" : "#fdf3e2";
  return `
    <div id="receiptCard" style="width:560px;background:#fff;font-family:'Inter',-apple-system,sans-serif;color:#1a2430;padding:40px 44px;border:1px solid #e4e8eb;box-sizing:border-box;">

      <!-- Header: logo + company block, RECEIPT label + no/date -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:2px solid #0f2a4a;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <img src="../assets/logo.png" alt="logo" style="width:46px;height:46px;object-fit:contain;flex-shrink:0;">
          <div>
            <div style="font-weight:700;font-size:16px;color:#0f2a4a;letter-spacing:-0.01em;">${esc(company.name)}</div>
            <div style="font-size:11px;color:#5b6570;margin-top:4px;max-width:230px;line-height:1.5;">${esc(company.address)}</div>
            <div style="font-size:11px;color:#5b6570;margin-top:2px;">${esc(company.phone)} &middot; ${esc(company.email)}</div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:19px;font-weight:800;color:#0f2a4a;letter-spacing:.05em;">RECEIPT</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#5b6570;margin-top:8px;">No. ${esc(receiptNo(sale))}</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#5b6570;margin-top:2px;">Date: ${esc(sale.sale_date || sale.date || "—")}</div>
          <div style="margin-top:8px;">
            <span style="display:inline-block;padding:4px 12px;border-radius:99px;font-weight:700;font-size:11px;letter-spacing:.05em;background:${statusBg};color:${statusColor};">${isPaid ? "PAID" : "UNPAID"}</span>
          </div>
        </div>
      </div>

      <!-- Received from -->
      <div style="margin-top:22px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#94a0aa;margin-bottom:5px;">Received From</div>
        <div style="font-size:15px;font-weight:600;color:#1a2430;">${esc(sale.client) || "—"}</div>
      </div>

      <!-- Item table -->
      <table style="width:100%;border-collapse:collapse;margin-top:24px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:0 0 8px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#94a0aa;border-bottom:1px solid #e4e8eb;font-weight:600;">Description</th>
            <th style="text-align:right;padding:0 0 8px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#94a0aa;border-bottom:1px solid #e4e8eb;font-weight:600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:16px 0;font-size:14px;color:#1a2430;border-bottom:1px solid #f0f2f3;vertical-align:top;">${esc(sale.description)}</td>
            <td style="padding:16px 0;font-size:14px;color:#1a2430;text-align:right;border-bottom:1px solid #f0f2f3;white-space:nowrap;">${fmtNaira(sale.amount)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Total -->
      <div style="display:flex;justify-content:flex-end;margin-top:4px;">
        <div style="width:230px;display:flex;justify-content:space-between;padding:12px 0 6px;font-size:16px;font-weight:800;color:#0f2a4a;border-top:2px solid #0f2a4a;">
          <span>TOTAL</span><span>${fmtNaira(sale.amount)}</span>
        </div>
      </div>

      <!-- Amount in words -->
      <div style="margin-top:10px;font-size:11.5px;color:#5b6570;font-style:italic;">
        Amount in words: ${esc(numberToWords(sale.amount))}
      </div>

      <!-- Signature block -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:52px;">
        <div style="width:180px;border-top:1px solid #c7cdd3;padding-top:6px;font-size:10.5px;color:#94a0aa;">Authorized Signature</div>
        <div style="text-align:right;font-size:11px;color:#5b6570;">${issuedBy ? "Issued by: " + esc(issuedBy) : ""}</div>
      </div>

      <!-- Footer -->
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e4e8eb;text-align:center;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;color:#94a0aa;">RC ${esc(company.rc)} &middot; THANK YOU FOR YOUR BUSINESS</div>
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
