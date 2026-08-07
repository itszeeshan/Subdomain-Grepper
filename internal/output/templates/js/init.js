// ── Lucide init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    buildFilters();
    buildBarCharts();
    renderSubdomains();
    renderHTTP();
    renderPorts();
    if (screenshots && screenshots.length) renderScreenshots();
    if (waybackRaw && waybackRaw.length) initWayback();
    if (takeoverData && takeoverData.length) renderTakeover();
    if (diffData) renderDiff();

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
});
