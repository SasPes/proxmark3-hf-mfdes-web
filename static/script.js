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

// Sub-tab switching for MFDes
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

    // Add event listener for deleteFileAid to load FIDs
    const deleteFileAid = document.getElementById('deleteFileAid');
    if (deleteFileAid) {
        deleteFileAid.addEventListener('change', loadDeleteFileIds);
    }
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

async function runSetMasterKey() {
    const newAlgo = document.getElementById('masterKeyNewAlgo').value;
    const keyStr = document.getElementById('masterKeyInput').value;
    const output = document.getElementById('output');
    if (!keyStr) {
        output.innerHTML = '<pre>Please enter a key.</pre>';
        return;
    }
    // Convert key to hex
    let hexKey = '';
    for (let i = 0; i < keyStr.length; i++) {
        hexKey += keyStr.charCodeAt(i).toString(16).padStart(2, '0');
    }
    let endpoint = `/hf/mfdes/changekey-master?newalgo=${newAlgo}&newkey=${hexKey}`;
    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;
    try {
        const res = await fetch(endpoint);
        const text = await res.text();
        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}

function confirmFormatCard() {
    if (confirm("Are you sure you want to format the card?\nThis action cannot be undone!")) {
        runFormatCard();
    }
}

async function runFormatCard() {
    const output = document.getElementById('output');
    output.innerHTML = `<pre>Running hf mfdes formatpicc ... please wait.</pre>`;
    let endpoint = '/hf/mfdes/formatpicc';
    if (getNoAuth()) {
        endpoint += '?no_auth=1';
    }
    try {
        const res = await fetch(endpoint);
        const text = await res.text();
        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}

function setupPasswordToggle(toggleBtnId, eyeIconId, inputId) {
    const toggleBtn = document.getElementById(toggleBtnId);
    const eyeIcon = document.getElementById(eyeIconId);
    const input = document.getElementById(inputId);
    if (toggleBtn && eyeIcon && input) {
        eyeIcon.style.filter = '';
        toggleBtn.addEventListener('click', function () {
            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.style.filter = 'grayscale(100%) opacity(0.5)';
            } else {
                input.type = 'password';
                eyeIcon.style.filter = '';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    setupPasswordToggle('toggleKeyVisibility', 'eyeIcon', 'key');
    setupPasswordToggle('toggleAppKeyVisibility', 'appEyeIcon', 'newAppKey');
    setupPasswordToggle('toggleMasterKeyVisibility', 'masterEyeIcon', 'masterKeyGlobal');
    setupPasswordToggle('toggleMasterKeyInputVisibility', 'masterKeyInputEyeIcon', 'masterKeyInput');
    setupPasswordToggle('toggleMasterKeyDefaultOldKeyVisibility', 'masterKeyDefaultOldKeyEyeIcon', 'masterKeyDefaultOldKey');
    setupPasswordToggle('toggleRecoveryEncKeyVisibility', 'recoveryEncKeyEyeIcon', 'recoveryEncKey');
    setupPasswordToggle('toggleRecoveryEncKeyConfirmVisibility', 'recoveryEncKeyConfirmEyeIcon', 'recoveryEncKeyConfirm');


    // Insert master key on any insertKeyBtn click
    document.querySelectorAll('.insertKeyBtn').forEach(btn => {
        btn.addEventListener('click', function () {
            const masterKeyInput = document.getElementById('masterKeyGlobal');
            // Find the input in the same .input-with-icon container
            const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (input && masterKeyInput) {
                input.value = masterKeyInput.value;
            }
        });
    });
});