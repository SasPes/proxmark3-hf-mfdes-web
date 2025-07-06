function runMfdesLsApp() {
    let endpoint = 'hf/mfdes/lsapp';
    if (getNoAuth()) {
        endpoint += '?no_auth=true';
    }
    runCmd(endpoint);
}

// Called after loading apps to fill appname dropdown
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

    const endpoint = getNoAuth() ? 'hf/mfdes/getappnames?noauth=1' : 'hf/mfdes/getappnames';

    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;

    try {
        const res = await fetch(`/${endpoint}`);
        if (!res.ok) throw new Error(res.statusText);
        const text = await res.text();

        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;

        // Parse AID and app name
        const appOptions = [];
        const regex = /\[=\] AID: (\d+) .* ISO DF name\[\d+\]:\s*(.+)$/gm;
        let match;
        while ((match = regex.exec(text)) !== null) {
            const aid = match[1].padStart(6, '0');
            const name = match[2].trim();
            appOptions.push({aid, name});
        }

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
            select.innerHTML = `<option value="">-- Select App --</option>` +
                appOptions.map(opt => `<option value="${opt.aid}">${opt.name}</option>`).join('');
            select.disabled = false;
            setKeyAidSelect.innerHTML = `<option value="">-- Select App --</option>` +
                appOptions.map(opt => `<option value="${opt.aid}">${opt.name}</option>`).join('');
            setKeyAidSelect.disabled = false;
            createFileAidSelect.innerHTML = `<option value="">-- Select App --</option>` +
                appOptions.map(opt => `<option value="${opt.aid}">${opt.name}</option>`).join('');
            createFileAidSelect.disabled = false;
            writeFileAidSelect.innerHTML = `<option value="">-- Select App --</option>` +
                appOptions.map(opt => `<option value="${opt.aid}">${opt.name}</option>`).join('');
            writeFileAidSelect.disabled = false;
            if (deleteFileAidSelect) {
                deleteFileAidSelect.innerHTML = `<option value="">-- Select App --</option>` +
                    appOptions.map(opt => `<option value="${opt.aid}">${opt.name}</option>`).join('');
                deleteFileAidSelect.disabled = false;
            }
            if (deleteAppAidSelect) {
                deleteAppAidSelect.innerHTML = `<option value="">-- Select App --</option>` +
                    appOptions.map(opt => `<option value="${opt.aid}">${opt.name}</option>`).join('');
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

    const endpoint = `/hf/mfdes/write?aid=${encodeURIComponent(aid)}&fid=${fid}&data=${hexData}&offset=${offset}`;

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
    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;
    try {
        const res = await fetch(endpoint);
        const text = await res.text();
        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}