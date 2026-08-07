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
