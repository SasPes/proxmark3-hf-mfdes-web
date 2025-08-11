function appendLogsParam(endpoint) {
    if (window.getLogsEnabled && window.getLogsEnabled()) {
        return endpoint + (endpoint.includes('?') ? '&' : '?') + 'logs=1';
    }
    return endpoint;
}

function runMfdesLsApp() {
    let endpoint = 'hf/mfdes/lsapp';
    if (getNoAuth()) {
        endpoint += '?no_auth=true';
    }
    endpoint = appendLogsParam(endpoint);
    runCmd(endpoint);
}

// Load app names and AIDs for dropdowns
async function loadAppNames() {
    const select = document.getElementById('appname');
    const output = document.getElementById('output');
    const loadAppsBtn = document.getElementById('loadAppsBtn');
    const setKeyAidSelect = document.getElementById('setAppKeyAid');
    const createFileAidSelect = document.getElementById('createFileAid');
    const writeFileAidSelect = document.getElementById('writeFileAid');
    const deleteFileAidSelect = document.getElementById('deleteFileAid');
    const deleteFileFidSelect = document.getElementById('deleteFileFid');
    const deleteAppAidSelect = document.getElementById('deleteAppAid');

    loadAppsBtn.disabled = true;

    const noauth = getNoAuth();
    let aidsEndpoint = noauth ? 'hf/mfdes/getaids?noauth=1' : 'hf/mfdes/getaids';
    let appNamesEndpoint = noauth ? 'hf/mfdes/getappnames?noauth=1' : 'hf/mfdes/getappnames';

    aidsEndpoint = appendLogsParam(aidsEndpoint);
    appNamesEndpoint = appendLogsParam(appNamesEndpoint);

    output.innerHTML = `<pre>Running ${aidsEndpoint} ... please wait.</pre>`;

    try {
        // 1. Fetch AIDs
        const aidsRes = await fetch(`/${aidsEndpoint}`);
        if (!aidsRes.ok) throw new Error(aidsRes.statusText);
        const aidsText = await aidsRes.text();

        // Parse AIDs
        const aids = [];
        const aidRegex = /\[\+\] ([0-9A-Fa-f]{6})/g;
        let match;
        while ((match = aidRegex.exec(aidsText)) !== null) {
            aids.push(match[1].toUpperCase());
        }

        output.innerHTML = `<pre>${highlightOutput(aidsText)}\nRunning ${appNamesEndpoint} ... please wait.</pre>`;

        // 2. Fetch app names
        const appNamesRes = await fetch(`/${appNamesEndpoint}`);
        if (!appNamesRes.ok) throw new Error(appNamesRes.statusText);
        const appNamesText = await appNamesRes.text();

        output.innerHTML = `<pre>${highlightOutput(aidsText)}\n${highlightOutput(appNamesText)}</pre>`;

        // Parse AID and app name
        const appNameMap = {};
        const appNameRegex = /\[=\] AID: ([0-9a-fA-F]+) ISO file id: \d+ ISO DF name\[\d+\]:\s*(.+)$/gm;
        while ((match = appNameRegex.exec(appNamesText)) !== null) {
            const aid = match[1].toUpperCase().padStart(6, '0');
            const name = match[2].trim();
            appNameMap[aid] = name;
        }

        // Build options: use name if present, else AID
        const appOptions = aids.map(aid => ({
            aid,
            name: appNameMap[aid] ? `${appNameMap[aid]}` : aid
        }));

        // Populate dropdowns
        if (appOptions.length === 0) {
            select.innerHTML = '<option value="">No apps found</option>';
            select.disabled = true;
            setKeyAidSelect.innerHTML = '<option value="">No apps found</option>';
            setKeyAidSelect.disabled = true;
            createFileAidSelect.innerHTML = '<option value="">No apps found</option>';
            createFileAidSelect.disabled = true;
            writeFileAidSelect.innerHTML = '<option value="">No apps found</option>';
            writeFileAidSelect.disabled = true;
            if (deleteFileAidSelect) {
                deleteFileAidSelect.innerHTML = '<option value="">No apps found</option>';
                deleteFileAidSelect.disabled = true;
            }
            if (deleteAppAidSelect) {
                deleteAppAidSelect.innerHTML = '<option value="">No apps found</option>';
                deleteAppAidSelect.disabled = true;
            }
        } else {
            const optionsHtml = `<option value="">-- Select App --</option>` +
                appOptions.map(opt => `<option value="${opt.aid}">${opt.name}</option>`).join('');
            select.innerHTML = optionsHtml;
            select.disabled = false;
            setKeyAidSelect.innerHTML = optionsHtml;
            setKeyAidSelect.disabled = false;
            createFileAidSelect.innerHTML = optionsHtml;
            createFileAidSelect.disabled = false;
            writeFileAidSelect.innerHTML = optionsHtml;
            writeFileAidSelect.disabled = false;
            if (deleteFileAidSelect) {
                deleteFileAidSelect.innerHTML = optionsHtml;
                deleteFileAidSelect.disabled = false;
            }
            if (deleteAppAidSelect) {
                deleteAppAidSelect.innerHTML = optionsHtml;
                deleteAppAidSelect.disabled = false;
            }
        }

        // Clear file IDs dropdown
        const fidSelect = document.getElementById('fileid');
        fidSelect.innerHTML = '<option value="">-- Select File ID --</option>';
        fidSelect.disabled = true;

        // Reset deleteFileFid
        if (deleteFileFidSelect) {
            deleteFileFidSelect.innerHTML = '<option value="">-- Select File ID --</option>';
            deleteFileFidSelect.disabled = true;
        }

    } catch (err) {
        output.innerHTML = `<pre>Error loading apps: ${escapeHTML(err.message)}</pre>`;
        select.innerHTML = '<option value="">Error loading apps</option>';
        select.disabled = true;
        if (deleteFileAidSelect) {
            deleteFileAidSelect.innerHTML = '<option value="">Error loading apps</option>';
            deleteFileAidSelect.disabled = true;
        }
        if (deleteAppAidSelect) {
            deleteAppAidSelect.innerHTML = '<option value="">Error loading apps</option>';
            deleteAppAidSelect.disabled = true;
        }
    } finally {
        loadAppsBtn.disabled = false;
        loadAppsBtn.textContent = 'Get Apps';
    }
}

// Called when user selects an app (AID) — fetch file IDs for that AID
async function loadFileIds() {
    const aid = document.getElementById('appname').value;
    const fidSelect = document.getElementById('fileid');
    const output = document.getElementById('output');

    if (!aid) {
        fidSelect.innerHTML = '<option value="">-- Select File ID --</option>';
        fidSelect.disabled = true;
        return;
    }

    fidSelect.disabled = true;
    fidSelect.innerHTML = '<option>Loading file IDs...</option>';

    let endpoint = `/hf/mfdes/getfileids?aid=${encodeURIComponent(aid)}`;
    if (getNoAuth()) {
        endpoint += '&no_auth=1';
    }
    endpoint = appendLogsParam(endpoint);

    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;

    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(res.statusText);
        const text = await res.text();

        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;

        // Parse file IDs — example line pattern expected:
        // [=] File ID: 01
        const fileIds = [];
        const regex = /\[=\] File ID: ([0-9a-fA-F]+)/gm;
        let match;
        while ((match = regex.exec(text)) !== null) {
            fileIds.push(match[1]);
        }

        if (fileIds.length === 0) {
            fidSelect.innerHTML = '<option value="">No file IDs found</option>';
            fidSelect.disabled = true;
        } else {
            fidSelect.innerHTML = '<option value="">-- Select File ID --</option>' +
                fileIds.map(fid => `<option value="${fid}">${fid}</option>`).join('');
            fidSelect.disabled = false;
        }
    } catch (err) {
        output.innerHTML = `<pre>Error loading file IDs: ${escapeHTML(err.message)}</pre>`;
        fidSelect.innerHTML = '<option value="">Error loading file IDs</option>';
        fidSelect.disabled = true;
    }
}

// For Delete File section: load file IDs for selected app
async function loadDeleteFileIds() {
    const aid = document.getElementById('deleteFileAid').value;
    const fidSelect = document.getElementById('deleteFileFid');
    const output = document.getElementById('output');

    if (!aid) {
        fidSelect.innerHTML = '<option value="">-- Select File ID --</option>';
        fidSelect.disabled = true;
        return;
    }

    fidSelect.disabled = true;
    fidSelect.innerHTML = '<option>Loading file IDs...</option>';

    let endpoint = `/hf/mfdes/getfileids?aid=${encodeURIComponent(aid)}`;
    if (getNoAuth()) {
        endpoint += '&no_auth=1';
    }
    endpoint = appendLogsParam(endpoint);

    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;

    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(res.statusText);
        const text = await res.text();

        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;

        // Parse file IDs
        const fileIds = [];
        const regex = /\[=\] File ID: ([0-9a-fA-F]+)/gm;
        let match;
        while ((match = regex.exec(text)) !== null) {
            fileIds.push(match[1]);
        }

        if (fileIds.length === 0) {
            fidSelect.innerHTML = '<option value="">No file IDs found</option>';
            fidSelect.disabled = true;
        } else {
            fidSelect.innerHTML = '<option value="">-- Select File ID --</option>' +
                fileIds.map(fid => `<option value="${fid}">${fid}</option>`).join('');
            fidSelect.disabled = false;
        }
    } catch (err) {
        output.innerHTML = `<pre>Error loading file IDs: ${escapeHTML(err.message)}</pre>`;
        fidSelect.innerHTML = '<option value="">Error loading file IDs</option>';
        fidSelect.disabled = true;
    }
}

// Called when user clicks read button
async function runRead() {
    const aid = document.getElementById('appname').value;
    const fid = document.getElementById('fileid').value;
    const output = document.getElementById('output');
    const readBtn = document.getElementById('readBtn');

    if (!aid || !fid) {
        output.innerHTML = '<pre>Please select both App (AID) and File ID (FID).</pre>';
        return;
    }

    readBtn.disabled = true;
    readBtn.textContent = 'Reading...';

    let endpoint = `/hf/mfdes/read?aid=${encodeURIComponent(aid)}&fid=${encodeURIComponent(fid)}`;
    if (getNoAuth()) {
        endpoint += '&no_auth=1';
    }
    endpoint = appendLogsParam(endpoint);

    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;

    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(res.statusText);
        const text = await res.text();

        const highlighted = highlightOutput(text);
        output.innerHTML = `<pre>${highlighted}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    } finally {
        readBtn.disabled = false;
        readBtn.textContent = 'Read file';
    }
}

async function runCreateApp() {
    const output = document.getElementById('output');
    output.innerHTML = `<pre>Creating app...</pre>`;

    const aid = document.getElementById('create-aid').value.trim();
    const fid = document.getElementById('create-fid').value.trim();
    const dfname = document.getElementById('create-dfname').value.trim();
    const dstalgo = document.getElementById('create-dstalgo').value;
    const ks1 = '0B';  // Hardcoded as requested
    const ks2 = 'AE';

    if (!aid || !fid || !dfname) {
        output.innerHTML = `<pre>Please fill in AID, FID, and DF Name.</pre>`;
        return;
    }

    let endpoint = `/hf/mfdes/createapp?aid=${encodeURIComponent(aid)}&fid=${encodeURIComponent(fid)}&dfname=${encodeURIComponent(dfname)}&dstalgo=${encodeURIComponent(dstalgo)}&ks1=${ks1}&ks2=${ks2}`;
    if (getNoAuth()) endpoint += `&no_auth=true`;
    endpoint = appendLogsParam(endpoint);

    try {
        const res = await fetch(endpoint);
        const text = await res.text();

        if (!res.ok) {
            output.innerHTML = `<pre>Error ${res.status}: ${escapeHTML(text)}</pre>`;
        } else {
            output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
        }
    } catch (err) {
        output.innerHTML = `<pre>Request failed: ${escapeHTML(err.message)}</pre>`;
    }
}

async function runChangeAppKey() {
    const aid = document.getElementById('setAppKeyAid').value;
    const keyStr = document.getElementById('newAppKey').value;
    const newkey = toHex(keyStr);  // Convert string to hex
    const output = document.getElementById('output');

    if (!aid || !newkey) {
        output.innerHTML = `<pre>Please select an App and enter a new key.</pre>`;
        return;
    }

    let endpoint = `/hf/mfdes/changekey?aid=${encodeURIComponent(aid)}&newkey=${encodeURIComponent(newkey)}`;
    endpoint = appendLogsParam(endpoint);

    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;

    try {
        const res = await fetch(endpoint);
        const text = await res.text();
        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}

async function runCreateFile() {
    const aid = document.getElementById('createFileAid').value;
    const output = document.getElementById('output');

    if (!aid) {
        output.innerHTML = `<pre>Please select an App (AID) to create a file.</pre>`;
        return;
    }

    let endpoint = `/hf/mfdes/createfile?aid=${encodeURIComponent(aid)}`;
    endpoint = appendLogsParam(endpoint);

    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;

    try {
        const res = await fetch(endpoint);
        const text = await res.text();
        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}

async function runWriteFile() {
    const aid = document.getElementById('writeFileAid').value;
    const plainText = document.getElementById('writeTextData').value.trim();
    const output = document.getElementById('output');

    const fid = "01";  // constant
    const offset = "000000";  // optional, constant for now

    if (!aid || !plainText) {
        output.innerHTML = `<pre>Please fill in AID and Plaintext to Write.</pre>`;
        return;
    }

    // Convert plain text to hex
    let hexData = '';
    for (let i = 0; i < plainText.length; i++) {
        hexData += plainText.charCodeAt(i).toString(16).padStart(2, '0');
    }

    let endpoint = `/hf/mfdes/write?aid=${encodeURIComponent(aid)}&fid=${fid}&data=${hexData}&offset=${offset}`;
    endpoint = appendLogsParam(endpoint);

    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;

    try {
        const res = await fetch(endpoint);
        const text = await res.text();
        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}

// Delete File logic
async function runDeleteFile() {
    const aid = document.getElementById('deleteFileAid').value;
    const fid = document.getElementById('deleteFileFid').value;
    const output = document.getElementById('output');

    if (!aid || !fid) {
        output.innerHTML = '<pre>Please select both App (AID) and File ID (FID) to delete.</pre>';
        return;
    }

    let endpoint = `/hf/mfdes/deletefile?aid=${encodeURIComponent(aid)}&fid=${encodeURIComponent(fid)}`;
    if (getNoAuth()) {
        endpoint += '&no_auth=1';
    }
    endpoint = appendLogsParam(endpoint);

    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;

    try {
        const res = await fetch(endpoint);
        const text = await res.text();
        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}

// Delete App logic
async function runDeleteApp() {
    const aid = document.getElementById('deleteAppAid').value;
    const output = document.getElementById('output');
    if (!aid) {
        output.innerHTML = '<pre>Please select an App (AID) to delete.</pre>';
        return;
    }
    let endpoint = `/hf/mfdes/deleteapp?aid=${encodeURIComponent(aid)}`;
    if (getNoAuth()) {
        endpoint += '&no_auth=1';
    }
    endpoint = appendLogsParam(endpoint);
    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;
    try {
        const res = await fetch(endpoint);
        const text = await res.text();
        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}

function extractAsciiText() {
    const outputDiv = document.getElementById('output');
    if (!outputDiv) return;

    // Get text content (strip HTML tags)
    const text = outputDiv.textContent || outputDiv.innerText || '';
    const lines = text.split('\n');
    const asciiLines = [];

    // Regex to match lines with ASCII column
    const asciiRegex = /^\[=\].*\|\s*([ -~]{1,16})\s*$/;

    for (const line of lines) {
        const match = asciiRegex.exec(line);
        if (match) {
            asciiLines.push(match[1]);
        }
    }

    // Remove header "Ascii" if present
    let filtered = asciiLines.filter((line, idx) => !(idx === 0 && line.trim().toLowerCase() === 'ascii'));

    // Join all lines into a single string
    let filteredText = filtered.join('');

    // Remove trailing dots
    filteredText = filteredText.replace(/\.*\s*$/g, '');

    // Remove new lines
    filteredText = filteredText.replace(/\n/g, ' ');

    // Split by dots, trim, filter empty, join with newlines
    const cleanedText = filteredText.split('.').map(s => s.trim()).filter(Boolean).join('\n');

    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(cleanedText).then(() => {
            showCopyConfirmation(outputDiv);
        });
    } else {
        const temp = document.createElement('textarea');
        temp.value = cleanedText;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        showCopyConfirmation(outputDiv);
    }
}

function showCopyConfirmation() {
    const extractBtn = document.getElementById('extractAsciiBtn');
    if (!extractBtn) return;
    const originalText = extractBtn.textContent;
    const originalColor = extractBtn.style.color;
    extractBtn.textContent = 'Copied to clipboard!';
    extractBtn.style.color = 'orange';
    setTimeout(() => {
        extractBtn.textContent = originalText;
        extractBtn.style.color = originalColor;
    }, 1500);
}