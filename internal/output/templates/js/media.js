// ── Screenshots ────────────────────────────────────────────────────────────
function renderScreenshots() {
    const grid = document.getElementById('screenshot-grid');
    if (!grid || !screenshots.length) return;
    grid.innerHTML = screenshots.map(s =>
        '<div class="screenshot-card">' +
        '<img class="ss-img" src="' + esc(s.filename) + '" data-sub="' + esc(s.subdomain) + '" data-url="' + esc(s.url) + '" alt="' + esc(s.subdomain) + '" loading="lazy" onclick="openLightbox(this)" onerror="this.alt=\'Screenshot not available\';this.style.height=\'80px\';this.style.objectFit=\'contain\';this.style.padding=\'20px\';this.style.color=\'#71717a\';this.style.fontSize=\'12px\'">' +
        '<div class="screenshot-card-body">' +
        '<div class="screenshot-card-title">' + esc(s.subdomain) + '</div>' +
        '<a class="screenshot-card-url" href="' + esc(s.url) + '" target="_blank">' + esc(s.url) + '</a>' +
        '</div></div>'
    ).join('');
}

// ── Screenshot lightbox ──────────────────────────────────────────────────
function openLightbox(img) {
    document.getElementById('lightbox-img').src = img.src;
    document.getElementById('lightbox-title').textContent = img.getAttribute('data-sub') || '';
    const a = document.getElementById('lightbox-url');
    const u = img.getAttribute('data-url') || '';
    a.href = u; a.textContent = u;
    document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
}

function setScreenshotView(view, btn) {
    const grid = document.getElementById('screenshot-grid');
    if (!grid) return;
    grid.classList.toggle('list-view', view === 'list');
    grid.querySelectorAll('.screenshot-card').forEach(c => c.classList.toggle('list-view', view === 'list'));
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function screenshotAll() {
    if (!screenshots || !screenshots.length) return;
    if (!confirm('Open ' + screenshots.length + ' URLs in new tabs?')) return;
    screenshots.forEach(s => window.open(s.url, '_blank'));
}
