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
