let showcaseProjects = [];

function showcaseFormHtml(p) {
  p = p || { title: "", description: "", status: "Ongoing", cover_image: "", images: [] };
  const existingThumbs = (p.images || []).map((url, i) => `
    <div class="thumb"><img src="${esc(url)}"><button type="button" data-remove-img="${i}">&times;</button></div>
  `).join("");
  return `
    <form id="showcaseForm">
      <div class="form-field"><label>Project Title</label><input id="f_title" required value="${esc(p.title)}"></div>
      <div class="form-field"><label>Description</label><textarea id="f_description" rows="4">${esc(p.description)}</textarea></div>
      <div class="form-field"><label>Status</label>
        <select id="f_status"><option ${p.status === "Ongoing" ? "selected" : ""}>Ongoing</option><option ${p.status === "Completed" ? "selected" : ""}>Completed</option></select>
      </div>
      <div class="form-field">
        <label>Cover Image ${p.cover_image ? "(leave blank to keep current)" : ""}</label>
        ${p.cover_image ? `<div class="thumb-row"><div class="thumb"><img src="${esc(p.cover_image)}"></div></div>` : ""}
        <input id="f_cover" type="file" accept="image/*" style="margin-top:8px;">
      </div>
      <div class="form-field">
        <label>Additional Images (optional, can select several)</label>
        <div class="thumb-row" id="existingThumbs">${existingThumbs}</div>
        <input id="f_images" type="file" accept="image/*" multiple style="margin-top:8px;">
      </div>
      <div class="upload-progress" id="showcaseMsg" style="display:none;"></div>
      <div class="form-actions"><button type="button" class="btn-cancel" id="cancelBtn">Cancel</button><button type="submit" class="btn-save">Save</button></div>
    </form>`;
}

function openShowcaseModal(existing) {
  const keptImages = existing ? [...(existing.images || [])] : [];
  const modal = openModal(existing ? "Edit Project" : "Add Project to Showcase", showcaseFormHtml(existing), true);
  modal.querySelector("#cancelBtn").addEventListener("click", closeModal);

  modal.querySelectorAll("[data-remove-img]").forEach((btn) => btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.removeImg);
    keptImages.splice(idx, 1);
    btn.closest(".thumb").remove();
  }));

  modal.querySelector("#showcaseForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = modal.querySelector("#showcaseMsg");
    const saveBtn = modal.querySelector(".btn-save");
    saveBtn.disabled = true;
    msg.style.display = "block";
    msg.textContent = "Saving…";

    const title = modal.querySelector("#f_title").value.trim();
    const description = modal.querySelector("#f_description").value.trim();
    const status = modal.querySelector("#f_status").value;
    const coverFile = modal.querySelector("#f_cover").files[0];
    const extraFiles = Array.from(modal.querySelector("#f_images").files || []);

    let coverImage = existing ? existing.cover_image : "";
    if (coverFile) {
      msg.textContent = "Uploading cover image…";
      const url = await uploadMedia(coverFile, "showcase");
      if (url) coverImage = url;
    }

    const newImageUrls = [];
    for (let i = 0; i < extraFiles.length; i++) {
      msg.textContent = `Uploading image ${i + 1} of ${extraFiles.length}…`;
      const url = await uploadMedia(extraFiles[i], "showcase");
      if (url) newImageUrls.push(url);
    }

    const finalImages = [...keptImages, ...newImageUrls];
    const data = { title, description, status, cover_image: coverImage, images: finalImages };

    if (existing) await updateShowcaseProject(existing.id, data);
    else await addShowcaseProject(data);

    saveBtn.disabled = false;
    closeModal();
    load();
  });
}

function showcaseCardHtml(p) {
  return `
    <div class="showcase-card">
      <div class="cover">${p.cover_image ? `<img src="${esc(p.cover_image)}">` : ""}</div>
      <div class="body">
        <h4>${esc(p.title)}</h4>
        <p>${esc((p.description || "").slice(0, 90))}${(p.description || "").length > 90 ? "…" : ""}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="badge ${badgeClass(p.status)}">${esc(p.status)}</span>
          <div class="row-actions">
            <button class="icon-btn" data-edit="${p.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
            <button class="icon-btn danger" data-del="${p.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
          </div>
        </div>
      </div>
    </div>`;
}

function render() {
  const grid = showcaseProjects.length
    ? `<div class="showcase-grid">${showcaseProjects.map(showcaseCardHtml).join("")}</div>`
    : emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="14" rx="1.5"/></svg>', "No showcase projects yet. Add your first one above.");

  document.getElementById("page-content").innerHTML = `
    <div class="toolbar">
      <h1 class="page-title" style="margin:0;">Project Showcase</h1>
      <div class="toolbar-actions">
        <button class="btn-add" id="addBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Add Project</button>
      </div>
    </div>
    <p style="font-size:13px;color:#94a3b8;margin:-10px 0 20px;">These appear publicly on the website's Projects page immediately &mdash; this is your portfolio, separate from the private "Projects &amp; Services" tracker.</p>
    ${grid}
  `;
  document.getElementById("addBtn").addEventListener("click", () => openShowcaseModal(null));
  document.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => openShowcaseModal(showcaseProjects.find((p) => p.id == btn.dataset.edit))));
  document.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    const proj = showcaseProjects.find((p) => p.id == btn.dataset.del);
    if (!confirm(`Remove "${proj.title}" from the public showcase?`)) return;
    await deleteShowcaseProject(proj.id);
    if (proj.cover_image) await deleteMediaByUrl(proj.cover_image);
    for (const url of proj.images || []) await deleteMediaByUrl(url);
    load();
  }));
}

async function load() { showcaseProjects = await getShowcaseProjects(); render(); }

(async function init() {
  const { profile } = await requireAuth();
  const company = await getCompany();
  renderShell("showcase", company, profile.full_name || profile.email);
  await load();
})();
