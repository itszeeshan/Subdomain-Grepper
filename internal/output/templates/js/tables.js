// ── Subdomains ────────────────────────────────────────────────────────────
function renderSubdomains() {
    const tbody = document.getElementById('subdomains-tbody');
    if (!tbody) return;
    const start = (subPage - 1) * ITEMS_PER_PAGE;
    const page = filteredSubdomains.slice(start, start + ITEMS_PER_PAGE);
    tbody.innerHTML = page.map(s =>
        '<tr><td><a class="link" href="https://' + esc(s.subdomain) + '" target="_blank"><strong>' + esc(s.subdomain) + '</strong></a></td>' +
        '<td><span class="badge badge-source">' + esc(s.parent) + '</span></td>' +
        '<td>' + s.source.split(',').map(src => '<span class="badge badge-source">' + esc(src.trim()) + '</span>').join(' ') + '</td>' +
        '<td>' + (s.ips === 'N/A' ? '<span style="color:#71717a">N/A</span>' : s.ips.split(', ').map(ip => '<span class="badge badge-ip">' + esc(ip) + '</span>').join(' ')) + '</td></tr>'
    ).join('');
    setPagination(subPage, filteredSubdomains.length, 'subdomains-info', 'subdomain-prev', 'subdomain-next');
}

function subdomainsPage(dir) {
    const total = filteredSubdomains.length;
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    subPage = Math.min(Math.max(1, subPage + dir), totalPages);
    renderSubdomains();
}

// ── HTTP ──────────────────────────────────────────────────────────────────
let currentHTTP = [...allHTTP];

function renderHTTP() { currentHTTP = [...allHTTP]; renderHTTPFiltered(currentHTTP); }

function renderHTTPFiltered(data) {
    currentHTTP = data;
    const tbody = document.getElementById('http-tbody');
    if (!tbody) return;
    const start = (httpPage_ - 1) * ITEMS_PER_PAGE;
    const page = data.slice(start, start + ITEMS_PER_PAGE);
    tbody.innerHTML = page.map(h =>
        '<tr><td><a class="link" href="' + esc(h.url) + '" target="_blank">' + esc(h.url) + '</a></td>' +
        '<td>' + statusBadge(h.status) + '</td>' +
        '<td>' + esc(h.title || '—') + '</td>' +
        '<td>' + (h.contentLength || '—') + '</td>' +
        '<td>' + techBadges(h.technologies, h.detectedTech) + '</td></tr>'
    ).join('');
    setPagination(httpPage_, data.length, 'http-info', 'http-prev', 'http-next');
    const badge = document.getElementById('http-count-badge');
    if (badge) badge.textContent = data.length + ' results';
}

function httpPage(dir) {
    const totalPages = Math.max(1, Math.ceil(currentHTTP.length / ITEMS_PER_PAGE));
    httpPage_ = Math.min(Math.max(1, httpPage_ + dir), totalPages);
    renderHTTPFiltered(currentHTTP);
}

// ── Ports ─────────────────────────────────────────────────────────────────
let currentPorts = [...allPorts];

function renderPorts() { currentPorts = [...allPorts]; renderPortsFiltered(currentPorts); }

function renderPortsFiltered(data) {
    currentPorts = data;
    const tbody = document.getElementById('ports-tbody');
    if (!tbody) return;
    const start = (portsPage_ - 1) * ITEMS_PER_PAGE;
    const page = data.slice(start, start + ITEMS_PER_PAGE);
    tbody.innerHTML = page.map(p =>
        '<tr><td><strong>' + esc(p.host) + '</strong></td>' +
        '<td><span class="badge badge-ip">' + esc(p.ip) + '</span></td>' +
        '<td>' + p.port + '</td>' +
        '<td>' + esc(p.protocol) + '</td>' +
        '<td>' + esc(p.state) + '</td>' +
        '<td>' + esc(p.service) + '</td>' +
        '<td>' + esc(p.version || '—') + '</td></tr>'
    ).join('');
    setPagination(portsPage_, data.length, 'ports-info', 'ports-prev', 'ports-next');
}

function portsPage(dir) {
    const totalPages = Math.max(1, Math.ceil(currentPorts.length / ITEMS_PER_PAGE));
    portsPage_ = Math.min(Math.max(1, portsPage_ + dir), totalPages);
    renderPortsFiltered(currentPorts);
}
