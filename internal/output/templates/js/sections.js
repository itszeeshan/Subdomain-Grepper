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
