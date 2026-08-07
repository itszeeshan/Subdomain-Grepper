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
