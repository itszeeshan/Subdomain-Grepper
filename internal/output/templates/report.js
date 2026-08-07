// ── Data ──────────────────────────────────────────────────────────────────
const allSubdomains = {{.Subdomains}};
const allHTTP       = {{.HTTPResults}};
const allPorts      = {{.PortResults}};
const domainStats   = {{.DomainStats}};
const sourceStats   = {{.SourceStats}};
const statusStats   = {{.StatusStats}};
const techStats     = {{.TechStats}};
const screenshots   = {{.Screenshots}};
const diffData      = {{.DiffData}};
const waybackRaw    = {{.WaybackData}};
const takeoverData  = {{.TakeoverData}};
const ITEMS_PER_PAGE = {{.ItemsPerPage}};

// ── State ────────────────────────────────────────────────────────────────
let filteredSubdomains = [...allSubdomains];
let subPage = 1, httpPage_ = 1, portsPage_ = 1;
let activeTab = 'subdomains';
let sortState = {}; // { tableId: { key, dir } }

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

// ── Tab switching ────────────────────────────────────────────────────────
function showTab(tab) {
    const allTabs = ['overview','subdomains','http','ports','screenshots','wayback','takeover','changes'];
    allTabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        const nav = document.getElementById('nav-' + t);
        if (el) el.classList.toggle('section-hidden', t !== tab);
        if (nav) nav.classList.toggle('active', t === tab);
    });
    activeTab = tab;

    // Page heading follows the active tab
    const titles = {
        overview: 'Overview', subdomains: 'Subdomains', http: 'HTTP Services',
        ports: 'Port Results', screenshots: 'Screenshots', wayback: 'Wayback URLs',
        takeover: 'Takeover Risks', changes: 'Changes'
    };
    const pt = document.getElementById('page-title');
    if (pt && titles[tab]) pt.textContent = titles[tab];

    // Filters pill only applies to the filterable table tabs
    const hasFilters = (tab === 'subdomains' || tab === 'http' || tab === 'ports');
    const fp = document.getElementById('filters-pill');
    if (fp) fp.style.display = hasFilters ? '' : 'none';
    const toolbar = document.getElementById('table-toolbar');
    if (toolbar) toolbar.style.display = hasFilters ? '' : 'none';
    // Generated date only belongs on the overview
    const dl = document.getElementById('date-label');
    if (dl) dl.style.display = (tab === 'overview') ? '' : 'none';
    if (!hasFilters) toggleDrawer(false);

    const si = document.getElementById('search-input');
    const dg = document.getElementById('domain-filter-group');
    const sg = document.getElementById('source-filter-group');
    const stg = document.getElementById('status-filter-group');
    const tg = document.getElementById('tech-filter-group');

    // Show/hide filter panel and appropriate filter groups
    const filterBody = document.getElementById('filter-body');
    const filterToggle = document.querySelector('.filter-toggle');

    if (tab === 'subdomains') {
        si.placeholder = 'Filter subdomains...';
        filterBody.style.display = ''; filterToggle.style.display = '';
        dg.style.display = ''; sg.style.display = ''; stg.style.display = 'none'; tg.style.display = 'none';
    } else if (tab === 'http') {
        si.placeholder = 'Filter by URL or title...';
        filterBody.style.display = ''; filterToggle.style.display = '';
        dg.style.display = 'none'; sg.style.display = 'none'; stg.style.display = ''; tg.style.display = '';
    } else if (tab === 'ports') {
        si.placeholder = 'Filter by host or service...';
        filterBody.style.display = ''; filterToggle.style.display = '';
        dg.style.display = 'none'; sg.style.display = 'none'; stg.style.display = 'none'; tg.style.display = 'none';
    } else {
        // screenshots, wayback, or changes — hide sidebar filter panel
        filterBody.style.display = 'none'; filterToggle.style.display = 'none';
    }
    if (tab === 'subdomains' || tab === 'http' || tab === 'ports') applyFilters();
}

// ── Filter drawer (slide-in) ─────────────────────────────────────────────
function toggleDrawer(force) {
    const drawer = document.getElementById('filter-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (!drawer) return;
    const open = force === undefined ? !drawer.classList.contains('open') : force;
    drawer.classList.toggle('open', open);
    if (backdrop) backdrop.classList.toggle('open', open);
}

// ── Filter panel toggle ──────────────────────────────────────────────────
function toggleFilters(btn) {
    const body = document.getElementById('filter-body');
    const chevron = document.getElementById('filter-chevron');
    body.classList.toggle('hidden');
    chevron.style.transform = body.classList.contains('hidden') ? 'rotate(-90deg)' : '';
}

// ── Build sidebar filter checkboxes ─────────────────────────────────────
function buildFilters() {
    const domains = [...new Set(allSubdomains.map(s => s.parent))].sort();
    const sources = [...new Set(allSubdomains.flatMap(s => s.source.split(',').map(x => x.trim())))].sort();
    const statuses = [...new Set(allHTTP.map(h => h.status))].sort((a,b) => a-b);
    const techSet = new Set(allHTTP.flatMap(h => {
        const basic = (h.technologies||'').split(',').map(x => x.trim()).filter(Boolean);
        const detected = (h.detectedTech||[]).map(t => t.name);
        return [...basic, ...detected];
    }));
    const techs = [...techSet].sort();

    buildChecks('domain-checkboxes', domains, applyFilters);
    buildChecks('source-checkboxes', sources, applyFilters);
    buildChecks('status-checkboxes', statuses.map(String), applyFilters);
    buildChecks('tech-checkboxes', techs, applyFilters);
}

function buildChecks(containerId, values, onChange) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    values.forEach(v => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        label.innerHTML = '<input type="checkbox" value="' + esc(v) + '" onchange="applyFilters()"><span class="checkbox-label" title="' + esc(v) + '">' + esc(v) + '</span>';
        el.appendChild(label);
    });
}

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.querySelectorAll('.checkbox-item input').forEach(cb => cb.checked = false);
    applyFilters();
}

// ── Apply filters ────────────────────────────────────────────────────────
function applyFilters() {
    const q = document.getElementById('search-input').value.toLowerCase();

    if (activeTab === 'subdomains') {
        const checkedDomains = checkedValues('domain-checkboxes');
        const checkedSources = checkedValues('source-checkboxes');

        filteredSubdomains = allSubdomains.filter(s => {
            const matchQ = !q || s.subdomain.toLowerCase().includes(q) || s.ips.toLowerCase().includes(q);
            const matchD = !checkedDomains.length || checkedDomains.includes(s.parent);
            const matchS = !checkedSources.length || s.source.split(',').map(x=>x.trim()).some(src => checkedSources.includes(src));
            return matchQ && matchD && matchS;
        });
        subPage = 1;
        renderSubdomains();
        document.getElementById('subdomain-count-badge').textContent = filteredSubdomains.length + ' results';

    } else if (activeTab === 'http') {
        const checkedStatus = checkedValues('status-checkboxes');
        const checkedTech = checkedValues('tech-checkboxes');
        const fHttp = allHTTP.filter(h => {
            const matchQ = !q || h.url.toLowerCase().includes(q) || (h.title||'').toLowerCase().includes(q);
            const matchS = !checkedStatus.length || checkedStatus.includes(String(h.status));
            const allTechNames = [...(h.technologies||'').split(',').map(x=>x.trim()).filter(Boolean), ...(h.detectedTech||[]).map(t=>t.name)];
            const matchT = !checkedTech.length || allTechNames.some(t => checkedTech.includes(t));
            return matchQ && matchS && matchT;
        });
        httpPage_ = 1;
        renderHTTPFiltered(fHttp);

    } else if (activeTab === 'ports') {
        const fPorts = allPorts.filter(p => {
            return !q || p.host.toLowerCase().includes(q) || p.service.toLowerCase().includes(q);
        });
        portsPage_ = 1;
        renderPortsFiltered(fPorts);
    }
}

function checkedValues(containerId) {
    return [...document.querySelectorAll('#' + containerId + ' input:checked')].map(cb => cb.value);
}

// ── Sorting ──────────────────────────────────────────────────────────────
function sortTable(tableId, key) {
    const state = sortState[tableId] || {};
    const dir = (state.key === key && state.dir === 'asc') ? 'desc' : 'asc';
    sortState[tableId] = { key, dir };

    // Update arrow indicators
    document.querySelectorAll('#' + tableId + '-table th .sort-arrow').forEach(el => {
        el.textContent = '';
        el.classList.remove('active');
    });
    const arrow = document.getElementById('sort-' + tableId + '-' + key);
    if (arrow) {
        arrow.textContent = dir === 'asc' ? ' ▲' : ' ▼';
        arrow.classList.add('active');
    }

    const compare = (a, b) => {
        let va = a[key], vb = b[key];
        if (typeof va === 'number' && typeof vb === 'number') return dir === 'asc' ? va - vb : vb - va;
        va = String(va||'').toLowerCase(); vb = String(vb||'').toLowerCase();
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
    };

    if (tableId === 'subdomains') { filteredSubdomains.sort(compare); subPage = 1; renderSubdomains(); }
    else if (tableId === 'http') { currentHTTP.sort(compare); httpPage_ = 1; renderHTTPFiltered(currentHTTP); }
    else if (tableId === 'ports') { currentPorts.sort(compare); portsPage_ = 1; renderPortsFiltered(currentPorts); }
    else if (tableId === 'wayback') { currentWayback.sort(compare); waybackPage_ = 1; renderWayback(); }
    else if (tableId === 'takeover') { currentTakeover.sort(compare); renderTakeover(); }
}

// ── Render helpers ────────────────────────────────────────────────────────
function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function statusBadge(code) {
    let cls = 'status-other';
    if (code >= 200 && code < 300) cls = 'status-ok';
    else if (code >= 300 && code < 400) cls = 'status-3xx';
    else if (code >= 400 && code < 500) cls = 'status-4xx';
    else if (code >= 500) cls = 'status-5xx';
    return '<span class="' + cls + '">' + code + '</span>';
}

function techBadgeClass(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('web server') || cat.includes('cache')) return 'badge-tech-webserver';
    if (cat.includes('framework')) return 'badge-tech-framework';
    if (cat.includes('cms') || cat.includes('e-commerce') || cat.includes('static site')) return 'badge-tech-cms';
    if (cat.includes('cdn') || cat.includes('waf') || cat.includes('load balancer')) return 'badge-tech-cdn';
    if (cat.includes('language')) return 'badge-tech-language';
    if (cat.includes('analytics')) return 'badge-tech-analytics';
    if (cat.includes('javascript') || cat.includes('css')) return 'badge-tech-js';
    if (cat.includes('paas') || cat.includes('platform')) return 'badge-tech-paas';
    return 'badge-tech';
}

function techBadges(techStr, detectedTech) {
    // Use structured detected tech if available
    if (detectedTech && detectedTech.length) {
        return detectedTech.map(t => {
            const cls = techBadgeClass(t.category);
            const ver = t.version ? '<span class="tech-version">v' + esc(t.version) + '</span>' : '';
            return '<span class="badge ' + cls + '" title="' + esc(t.category) + '">' + esc(t.name) + ver + '</span>';
        }).join(' ');
    }
    // Fallback to basic technologies string
    if (!techStr || techStr === 'N/A') return '<span style="color:#71717a">N/A</span>';
    return techStr.split(',').map(t => t.trim()).filter(Boolean).map(t => '<span class="badge badge-tech">' + esc(t) + '</span>').join(' ');
}

function setPagination(page, total, infoId, prevId, nextId) {
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    document.getElementById(infoId).textContent = 'Page ' + page + ' of ' + totalPages + ' (' + total + ' items)';
    document.getElementById(prevId).disabled = page <= 1;
    document.getElementById(nextId).disabled = page >= totalPages;
}

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

// ── Diff / Changes ──────────────────────────────────────────────────────
function renderDiff() {
    if (!diffData) return;
    const container = document.getElementById('diff-content');
    if (!container) return;

    const totalChanges = (diffData.added||[]).length + (diffData.removed||[]).length + (diffData.ip_changes||[]).length;

    const statNum = document.getElementById('diff-stat-number');
    if (statNum) statNum.textContent = totalChanges;

    const badge = document.getElementById('changes-count-badge');
    if (badge) badge.textContent = totalChanges + ' changes';

    let html = '';

    if (diffData.added && diffData.added.length) {
        html += '<div class="diff-group">' +
            '<div class="diff-group-title"><span class="badge badge-added">+' + diffData.added.length + ' Added</span> New subdomains since last scan</div>' +
            '<div class="diff-list">' +
            diffData.added.map(s => '<div class="diff-item added"><span class="prefix">+</span>' + esc(s) + '</div>').join('') +
            '</div></div>';
    }

    if (diffData.removed && diffData.removed.length) {
        html += '<div class="diff-group">' +
            '<div class="diff-group-title"><span class="badge badge-removed">-' + diffData.removed.length + ' Removed</span> No longer found</div>' +
            '<div class="diff-list">' +
            diffData.removed.map(s => '<div class="diff-item removed"><span class="prefix">-</span>' + esc(s) + '</div>').join('') +
            '</div></div>';
    }

    if (diffData.ip_changes && diffData.ip_changes.length) {
        html += '<div class="diff-group">' +
            '<div class="diff-group-title"><span class="badge badge-changed">~' + diffData.ip_changes.length + ' Changed</span> IP address changes</div>' +
            '<div class="diff-list">' +
            diffData.ip_changes.map(c =>
                '<div class="diff-item changed"><span class="prefix">~</span>' + esc(c.subdomain) +
                '<span class="diff-ips">' + esc((c.old_ips||[]).join(',')) + ' → ' + esc((c.new_ips||[]).join(',')) + '</span></div>'
            ).join('') +
            '</div></div>';
    }

    if (!html) {
        html = '<div class="empty-state">No changes detected compared to previous scan.</div>';
    }

    container.innerHTML = html;
}

// ── Wayback URLs ──────────────────────────────────────────────────────────
let allWayback = []; // flattened [{subdomain, domain, url}]
let currentWayback = [];
let waybackPage_ = 1;

function initWayback() {
    // Flatten wayback data into rows
    if (!waybackRaw || !waybackRaw.length) return;
    waybackRaw.forEach(entry => {
        (entry.urls || []).forEach(u => {
            allWayback.push({ subdomain: entry.subdomain, domain: entry.domain, url: u });
        });
    });
    currentWayback = [...allWayback];

    // Populate domain filter dropdown
    const select = document.getElementById('wayback-domain-filter');
    if (select) {
        const domains = [...new Set(allWayback.map(w => w.domain))].sort();
        domains.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d; opt.textContent = d;
            select.appendChild(opt);
        });
    }
    renderWayback();
}

function renderWayback() {
    const tbody = document.getElementById('wayback-tbody');
    if (!tbody) return;

    const domainFilter = (document.getElementById('wayback-domain-filter') || {}).value || '';
    const q = (document.getElementById('wayback-search') || {}).value.toLowerCase() || '';

    currentWayback = allWayback.filter(w => {
        const matchD = !domainFilter || w.domain === domainFilter;
        const matchQ = !q || w.url.toLowerCase().includes(q) || w.subdomain.toLowerCase().includes(q);
        return matchD && matchQ;
    });

    const start = (waybackPage_ - 1) * ITEMS_PER_PAGE;
    const page = currentWayback.slice(start, start + ITEMS_PER_PAGE);
    tbody.innerHTML = page.map(w =>
        '<tr><td><strong>' + esc(w.subdomain) + '</strong></td>' +
        '<td><span class="badge badge-source">' + esc(w.domain) + '</span></td>' +
        '<td><a class="link" href="' + esc(w.url) + '" target="_blank">' + esc(w.url) + '</a></td></tr>'
    ).join('');
    setPagination(waybackPage_, currentWayback.length, 'wayback-info', 'wayback-prev', 'wayback-next');

    const badge = document.getElementById('wayback-count-badge');
    if (badge) badge.textContent = currentWayback.length + ' URLs';
}

function waybackPage(dir) {
    const totalPages = Math.max(1, Math.ceil(currentWayback.length / ITEMS_PER_PAGE));
    waybackPage_ = Math.min(Math.max(1, waybackPage_ + dir), totalPages);
    renderWayback();
}

// ── Takeover ──────────────────────────────────────────────────────────────
let currentTakeover = [];
function renderTakeover() {
    const tbody = document.getElementById('takeover-tbody');
    if (!tbody || !takeoverData) return;
    currentTakeover = [...takeoverData];
    const riskOrder = { high: 0, medium: 1, low: 2 };
    currentTakeover.sort((a, b) => (riskOrder[a.risk] || 3) - (riskOrder[b.risk] || 3));
    tbody.innerHTML = currentTakeover.map(r => {
        const riskColors = { high: '#f87171', medium: '#f97316', low: '#fbbf24' };
        const riskBg = { high: 'rgba(248,113,113,0.15)', medium: 'rgba(249,115,22,0.16)', low: 'rgba(251,191,36,0.15)' };
        return '<tr>' +
            '<td><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;color:' + (riskColors[r.risk]||'#666') + ';background:' + (riskBg[r.risk]||'#eee') + '">' + esc(r.risk.toUpperCase()) + '</span></td>' +
            '<td><strong>' + esc(r.subdomain) + '</strong></td>' +
            '<td>' + esc(r.cname || 'N/A') + '</td>' +
            '<td><span class="badge badge-source">' + esc(r.service) + '</span></td>' +
            '<td style="font-size:12px;color:#a1a1aa">' + esc(r.evidence) + '</td>' +
            '</tr>';
    }).join('');
}

// ── Bar charts ────────────────────────────────────────────────────────────
function buildBarCharts() {
    renderBars('source-bars', sourceStats.slice(0, 12));
    renderBars('domain-bars', domainStats.slice(0, 12));

    let defaultChart = 'source';

    // Status code chart — vertical bars; reveal its tab and default to it
    if (statusStats && statusStats.length) {
        document.getElementById('status-chart-card').style.display = '';
        renderVerticalBars('status-bars', statusStats);
        defaultChart = 'status';
    }

    // Technology chart — reveal its tab
    if (techStats && techStats.length) {
        document.getElementById('tech-chart-card').style.display = '';
        renderBars('tech-bars', techStats.slice(0, 10));
    }

    // Activate the default breakdown tab
    const btn = document.querySelector('.chart-tab[data-chart="' + defaultChart + '"]');
    switchChart(defaultChart, btn);
}

// ── Breakdown panel tab switching ─────────────────────────────────────────
function switchChart(name, btn) {
    document.querySelectorAll('.chart-pane').forEach(p => {
        p.style.display = p.getAttribute('data-chart') === name ? '' : 'none';
    });
    document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function renderBars(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el || !data.length) { el && (el.innerHTML = '<span style="color:#71717a;font-size:12px">No data</span>'); return; }
    const max = data[0].count;
    el.innerHTML = data.map(d =>
        '<div class="bar-row">' +
        '<div class="bar-label-row"><span class="bar-name" title="' + esc(d.name) + '">' + esc(d.name) + '</span><span class="bar-count">' + d.count + '</span></div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(d.count / max * 100) + '%"></div></div>' +
        '</div>'
    ).join('');
}

// Vertical bar chart (used for HTTP status codes).
function renderVerticalBars(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el || !data.length) { el && (el.innerHTML = '<span style="color:#71717a;font-size:12px">No data</span>'); return; }
    const max = Math.max(...data.map(d => d.count));
    el.className = 'vbar-chart';
    el.innerHTML = data.map(d => {
        let cls = '';
        if (d.name.startsWith('2xx')) cls = 'green';
        else if (d.name.startsWith('3xx')) cls = 'orange';
        else if (d.name.startsWith('4xx') || d.name.startsWith('5xx')) cls = 'red';
        const h = Math.max(6, Math.round(d.count / max * 100));
        return '<div class="vbar">' +
            '<div class="vbar-track"><div class="vbar-col ' + cls + '" style="height:' + h + '%">' +
            '<span class="vbar-value">' + d.count + '</span></div></div>' +
            '<span class="vbar-label">' + esc(d.name) + '</span></div>';
    }).join('');
}

function renderColorBars(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el || !data.length) return;
    const max = Math.max(...data.map(d => d.count));
    el.innerHTML = data.map(d => {
        let colorClass = '';
        if (d.name.startsWith('2xx')) colorClass = 'green';
        else if (d.name.startsWith('3xx')) colorClass = 'orange';
        else if (d.name.startsWith('4xx') || d.name.startsWith('5xx')) colorClass = 'red';
        return '<div class="bar-row">' +
            '<div class="bar-label-row"><span class="bar-name">' + esc(d.name) + '</span><span class="bar-count">' + d.count + '</span></div>' +
            '<div class="bar-track"><div class="bar-fill ' + colorClass + '" style="width:' + Math.round(d.count / max * 100) + '%"></div></div>' +
            '</div>';
    }).join('');
}

// ── Export ────────────────────────────────────────────────────────────────
function exportData(type, format) {
    let data, filename;

    if (type === 'subdomains') {
        data = filteredSubdomains;
        filename = 'subdomains';
    } else if (type === 'http') {
        data = currentHTTP;
        filename = 'http_services';
    } else if (type === 'ports') {
        data = currentPorts;
        filename = 'port_results';
    } else if (type === 'wayback') {
        data = currentWayback;
        filename = 'wayback_urls';
    } else if (type === 'takeover') {
        data = currentTakeover;
        filename = 'takeover_risks';
    } else if (type === 'changes') {
        data = diffData;
        filename = 'diff_changes';
        format = 'json';
    } else return;

    if (format === 'json') {
        downloadFile(filename + '.json', JSON.stringify(data, null, 2), 'application/json');
    } else if (format === 'csv') {
        downloadFile(filename + '.csv', toCSV(data), 'text/csv');
    }
}

function toCSV(data) {
    if (!data || !data.length) return '';
    const keys = Object.keys(data[0]);
    const header = keys.join(',');
    const rows = data.map(row => keys.map(k => {
        let v = String(row[k] || '');
        if (v.includes(',') || v.includes('"') || v.includes('\n')) v = '"' + v.replace(/"/g, '""') + '"';
        return v;
    }).join(','));
    return header + '\n' + rows.join('\n');
}

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
