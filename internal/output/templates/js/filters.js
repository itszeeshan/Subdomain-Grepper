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
