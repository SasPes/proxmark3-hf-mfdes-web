let noAuthEnabled = false;

function toggleNoAuth() {
    noAuthEnabled = !noAuthEnabled;
    const btn = document.getElementById('noAuthToggle');
    btn.textContent = `No Auth: ${noAuthEnabled ? 'ON' : 'OFF'}`;
    btn.classList.toggle('active', noAuthEnabled);
}

function getNoAuth() {
    return noAuthEnabled;
}

document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById('noAuthToggle');
    let noAuthEnabled = false;

    btn.addEventListener('click', function () {
        noAuthEnabled = !noAuthEnabled;

        btn.textContent = `No Auth: ${noAuthEnabled ? 'ON' : 'OFF'}`;
        btn.classList.toggle('active', noAuthEnabled);
    });

    // Make it globally accessible if needed
    window.getNoAuth = () => noAuthEnabled;
});

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');

        // Remove active class from all buttons and contents
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

        // Add active to clicked button and associated content
        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Sub-tab switching for MFDes File Access
document.addEventListener("DOMContentLoaded", function () {
    const subTabButtons = document.querySelectorAll('.sub-tab-button');
    const subTabContents = document.querySelectorAll('.sub-tab-content');

    subTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const subTabId = button.getAttribute('data-subtab');
            subTabButtons.forEach(btn => btn.classList.remove('active'));
            subTabContents.forEach(tc => tc.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(subTabId).classList.add('active');
        });
    });
});

async function startPm3() {
    const output = document.getElementById('output');  // same output area for all commands
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

function runFreemem() {
    let endpoint = 'hf/mfdes/freemem';
    if (getNoAuth()) {
        endpoint += '?no_auth=1';
    }
    runCmd(endpoint);
}


async function runCmd(endpoint) {
    const output = document.getElementById('output');
    output.innerHTML = `Running ${endpoint}... Please wait.`;
    try {
        const res = await fetch('/' + endpoint);
        if (!res.ok) throw new Error(res.statusText);
        const text = await res.text();
        output.innerHTML = '<pre>' + highlightOutput(text) + '</pre>';
    } catch (err) {
        output.innerHTML = `<pre>Error: ${err.message}</pre>`;
    }
}

async function runDefault(event) {
    event.preventDefault();
    const out = document.getElementById('output');
    out.innerHTML = `<pre>Running MFDes Profile command (hf mfdes default)...</pre>`;

    const type = document.getElementById('type').value;
    const keyStr = document.getElementById('key').value;
    const key = toHex(keyStr);  // Convert string to hex

    try {
        const res = await fetch(`/hf/mfdes/set-default?type=${encodeURIComponent(type)}&key=${encodeURIComponent(key)}`);
        const text = await res.text();
        out.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        out.innerHTML = `<pre>Error: ${err.message}</pre>`;
    }
}

async function runSetDefaultProfile() {
    const out = document.getElementById('output');
    out.innerHTML = `<pre>Setting default profile to DES / 0000000000000000...</pre>`;

    try {
        const res = await fetch(`/hf/mfdes/set-default?type=DES&key=0000000000000000`);
        const text = await res.text();
        out.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        out.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}

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

    loadAppsBtn.disabled = true;
    loadAppsBtn.textContent = 'Loading apps...';

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
        }

        // Clear file IDs dropdown
        const fidSelect = document.getElementById('fileid');
        fidSelect.innerHTML = '<option value="">-- Select File ID --</option>';
        fidSelect.disabled = true;

    } catch (err) {
        output.innerHTML = `<pre>Error loading apps: ${escapeHTML(err.message)}</pre>`;
        select.innerHTML = '<option value="">Error loading apps</option>';
        select.disabled = true;
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

function strToHex() {
    const str = document.getElementById('strInput').value;
    let hexWithSpaces = '';
    for (let i = 0; i < str.length; i++) {
        hexWithSpaces += str.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
    }
    const hexNoSpaces = hexWithSpaces.replace(/\s+/g, '');
    document.getElementById('output').innerHTML =
        `<pre>String: ${str}\nHex: ${hexNoSpaces}</pre>`;
}

function hexToStr() {
    const hexInput = document.getElementById('hexInput').value;
    const hex = hexInput.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]*$/.test(hex)) {
        document.getElementById('output').innerHTML = `<pre>Invalid hex string!</pre>`;
        return;
    }
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    document.getElementById('output').innerHTML =
        `<pre>String: ${str}\nHex: ${hex}</pre>`;
}

function toHex(str) {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
}

// Run strToHex() on Enter in the String input
document.getElementById('strInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // prevent form submission if inside a form
        strToHex();
    }
});

// Run hexToStr() on Enter in the Hex input
document.getElementById('hexInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        hexToStr();
    }
});

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
