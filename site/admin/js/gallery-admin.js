let galleryItems = [];

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 50;

function fileSizeMB(file) { return file.size / (1024 * 1024); }

function galleryTileHtml(item) {
  const media = item.media_type === "video"
    ? `<video src="${esc(item.url)}" muted></video>`
    : `<img src="${esc(item.url)}" alt="${esc(item.caption || "")}">`;
  return `
    <div class="gallery-tile">
      <button class="tile-del" title="Remove" data-del="${item.id}" data-url="${esc(item.url)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
      </button>
      <div class="media-wrap">${media}</div>
      ${item.caption ? `<div class="caption">${esc(item.caption)}</div>` : ""}
    </div>`;
}

function render() {
  const grid = galleryItems.length
    ? `<div class="gallery-grid">${galleryItems.map(galleryTileHtml).join("")}</div>`
    : emptyStateHtml('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="8" height="8" rx="1.2"/><rect x="13" y="3" width="8" height="8" rx="1.2"/><rect x="3" y="13" width="8" height="8" rx="1.2"/><rect x="13" y="13" width="8" height="8" rx="1.2"/></svg>', "No photos or videos yet. Upload the first one above.");

  document.getElementById("page-content").innerHTML = `
    <h1 class="page-title">Gallery</h1>
    <p style="font-size:13px;color:#94a3b8;margin:-10px 0 20px;">Anything uploaded here appears publicly on the website's Gallery page immediately.</p>

    <div class="upload-card">
      <h3>Upload Photo or Video</h3>
      <form id="uploadForm">
        <div class="form-row-2">
          <div class="form-field"><label>File (image or video)</label><input id="f_file" type="file" accept="image/*,video/*" required>
            <span style="font-size:11.5px;color:#94a3b8;margin-top:4px;">Max ${MAX_IMAGE_MB}MB for photos, ${MAX_VIDEO_MB}MB for videos</span>
          </div>
          <div class="form-field"><label>Caption (optional)</label><input id="f_caption" type="text" placeholder="e.g. Site delivery, August 2026"></div>
        </div>
        <button type="submit" class="btn-add" id="uploadBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Add to Gallery</button>
        <div class="upload-progress" id="uploadMsg" style="display:none;"></div>
      </form>
    </div>

    ${grid}
  `;

  document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("f_file");
    const caption = document.getElementById("f_caption").value.trim();
    const file = fileInput.files[0];
    const msg = document.getElementById("uploadMsg");
    const btn = document.getElementById("uploadBtn");
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const limitMB = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (fileSizeMB(file) > limitMB) {
      msg.style.display = "block";
      msg.style.color = "#e11d48";
      msg.textContent = `That ${isVideo ? "video" : "image"} is ${fileSizeMB(file).toFixed(1)}MB — the limit is ${limitMB}MB per file (your free Supabase storage plan only has 1GB total, so large files fill it up fast). Try a smaller or compressed file.`;
      return;
    }

    btn.disabled = true;
    msg.style.display = "block";
    msg.style.color = "";
    msg.textContent = "Uploading… this may take a moment for videos.";

    const url = await uploadMedia(file, "gallery");
    if (!url) { btn.disabled = false; msg.style.display = "none"; return; }

    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    await addGalleryItem({ media_type: mediaType, url, caption });
    btn.disabled = false;
    msg.style.display = "none";
    load();
  });

  document.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    if (!confirm("Remove this from the gallery? This cannot be undone.")) return;
    await deleteGalleryItem(btn.dataset.del);
    await deleteMediaByUrl(btn.dataset.url);
    load();
  }));
}

async function load() { galleryItems = await getGalleryItems(); render(); }

(async function init() {
  const { profile } = await requireAuth();
  const company = await getCompany();
  renderShell("gallery", company, profile.full_name || profile.email);
  await load();
})();
