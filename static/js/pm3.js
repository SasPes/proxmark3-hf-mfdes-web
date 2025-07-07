async function startPm3() {
    const output = document.getElementById('output');
    const startBtn = document.getElementById('startPm3Btn');
    const path = document.getElementById('pm3path').value.trim();

    if (!path) {
        output.innerHTML = '<pre>Please provide a valid path to the Proxmark3 executable.</pre>';
        return;
    }

    startBtn.disabled = true;
    startBtn.textContent = 'Starting...';
    output.innerHTML = `<pre>Starting Proxmark3 shell at: ${path} ... please wait.</pre>`;

    try {
        const res = await fetch(`/start-pm3?path=${encodeURIComponent(path)}`);
        const text = await res.text();
        output.innerHTML = `<pre>${text}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error starting Proxmark3 shell: ${err.message}</pre>`;
    } finally {
        startBtn.disabled = false;
        startBtn.textContent = 'Start Proxmark3';
    }
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function highlightOutput(text) {
    const escaped = escapeHTML(text);
    return escaped
        .replace(/^(\[\+\]\s+Auth.*)$/gm, '<span class="pm-success-auth">$1</span>')
        .replace(/^(\[\+\] #.*)$/gm, '<span class="pm-success-hash">$1</span>')
        .replace(/^(\[\+\] \[.*\].*)$/gm, '<span class="pm-success-detail">$1</span>')
        .replace(/^(\[\+\].*)$/gm, '<span class="pm-success">$1</span>')
        .replace(/^(\[\*\].*)$/gm, '<span class="pm-info">$1</span>')
        .replace(/^(\[\=\].*)$/gm, '<span class="pm-equal">$1</span>')
        .replace(/^(\[\?\].*)$/gm, '<span class="pm-question">$1</span>')
        .replace(/^(\[\-\].*)$/gm, '<span class="pm-warn">$1</span>')
        .replace(/^(\[\!\!\].*)$/gm, '<span class="pm-error-double">$1</span>')
        .replace(/^(\[\!\].*)$/gm, '<span class="pm-error">$1</span>')
        .replace(/(UID: .*)/g, '<span class="pm-uid">$1</span>')
        .replace(/(ATQA: .*)/g, '<span class="pm-atqa">$1</span>')
        .replace(/\b(NO)\b/g, '<span class="pm-no">$1</span>')
        .replace(/\b(YES)\b/g, '<span class="pm-yes">$1</span>');
}