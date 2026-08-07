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
