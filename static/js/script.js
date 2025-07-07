// --- Tab switching logic ---
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            button.classList.add('active');
            const tabContent = document.getElementById(tabId);
            tabContent.classList.add('active');
            if (tabId === 'tab3') {
                loadMfdesTabContent();
            } else if (tabId === 'tab5') {
                loadRecoveryTabContent();
            }
        });
    });

    // On initial load, if tab3 or tab5 is active, load their content
    const tab3 = document.getElementById('tab3');
    if (tab3 && tab3.classList.contains('active')) {
        loadMfdesTabContent();
    }
    const tab5 = document.getElementById('tab5');
    if (tab5 && tab5.classList.contains('active')) {
        loadRecoveryTabContent();
    }

    // Simulate click on Recovery Codes tab on start
    const recoveryTabBtn = document.querySelector('.tab-button[data-tab="tab5"]');
    if (recoveryTabBtn) {
        recoveryTabBtn.click();
    }
});

function loadMfdesTabContent() {
    const tab3 = document.getElementById('tab3');
    if (tab3 && tab3.innerHTML.trim() === '') {
        console.log('Loading MFDes tab content...');
        fetch('/static/tabs/mfdes.html')
            .then(res => res.text())
            .then(html => {
                tab3.innerHTML = html;
                setupMfdesSubTabs();
            });
    }
}

function loadRecoveryTabContent() {
    const tab5 = document.getElementById('tab5');
    if (tab5 && tab5.innerHTML.trim() === '') {
        fetch('/static/tabs/recovery-codes.html')
            .then(res => res.text())
            .then(html => {
                tab5.innerHTML = html;
                // Optionally, re-initialize any JS needed for this tab
            });
    }
}

function setupMfdesSubTabs() {
    const subTabButtons = document.querySelectorAll('#tab3 .sub-tab-button');
    const subTabContents = document.querySelectorAll('#tab3 .sub-tab-content');

    subTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const subTabId = button.getAttribute('data-subtab');
            subTabButtons.forEach(btn => btn.classList.remove('active'));
            subTabContents.forEach(tc => tc.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(subTabId).classList.add('active');
        });
    });
}

// --- No Auth toggle ---
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

function runFreemem() {
    let endpoint = 'hf/mfdes/freemem';
    if (window.getNoAuth && window.getNoAuth()) {
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
    const key = toHex(keyStr);

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
        e.preventDefault();
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
    if (window.getNoAuth && window.getNoAuth()) {
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

// --- Password visibility toggles and insert key ---
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
            const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (input && masterKeyInput) {
                input.value = masterKeyInput.value;
            }
        });
    });
});