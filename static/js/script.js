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

function setupInsertKeyButtons() {
    document.querySelectorAll('.insertKeyBtn').forEach(btn => {
        btn.addEventListener('click', function () {
            const masterKeyInput = document.getElementById('masterKeyGlobal');
            const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (input && masterKeyInput) {
                input.value = masterKeyInput.value;
            }
        });
    });
}

function loadMfdesTabContent() {
    const tab3 = document.getElementById('tab3');
    if (tab3 && tab3.innerHTML.trim() === '') {
        console.log('Loading MFDes tab content...');
        fetch('/static/tabs/mfdes.html')
            .then(res => res.text())
            .then(html => {
                tab3.innerHTML = html;
                setupMfdesSubTabs();
                setupInsertKeyButtons();

                setupPasswordToggle('toggleMasterKeyInputVisibility', 'masterKeyInputEyeIcon', 'masterKeyInput');
                setupPasswordToggle('toggleMasterKeyDefaultOldKeyVisibility', 'masterKeyDefaultOldKeyEyeIcon', 'masterKeyDefaultOldKey');
                setupPasswordToggle('toggleAppKeyVisibility', 'appEyeIcon', 'newAppKey');
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
                setupInsertKeyButtons();

                setupPasswordToggle('toggleRecoveryEncKeyVisibility', 'recoveryEncKeyEyeIcon', 'recoveryEncKey');
                setupPasswordToggle('toggleRecoveryEncKeyConfirmVisibility', 'recoveryEncKeyConfirmEyeIcon', 'recoveryEncKeyConfirm');
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

document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById('noAuthToggle');
    let noAuthEnabled = false;

    btn.addEventListener('click', function () {
        noAuthEnabled = !noAuthEnabled;
        btn.textContent = `No Auth: ${noAuthEnabled ? 'ON' : 'OFF'}`;
        btn.classList.toggle('active', noAuthEnabled);
    });
    window.getNoAuth = () => noAuthEnabled;

    const logsBtn = document.getElementById('logsToggleBtn');
    let logsEnabled = false;

    logsBtn.addEventListener('click', function () {
        logsEnabled = !logsEnabled;
        logsBtn.textContent = `File Logging: ${logsEnabled ? 'ON' : 'OFF'}`;
        logsBtn.classList.toggle('active', logsEnabled);
    });
    window.getLogsEnabled = () => logsEnabled;
});

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

function setupGenericTooltips(jsonPath = '/static/tips/tooltip.json') {
    let tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'info-tooltip';
    tooltipDiv.style.display = 'none';
    tooltipDiv.style.position = 'absolute';
    document.body.appendChild(tooltipDiv);

    fetch(jsonPath)
        .then(res => res.json())
        .then(tooltipData => {
            document.querySelectorAll('legend[id]').forEach(legend => {
                legend.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (tooltipData[legend.id]) {
                        tooltipDiv.innerHTML = tooltipData[legend.id];
                        const rect = legend.getBoundingClientRect();
                        tooltipDiv.style.top = `${rect.bottom + window.scrollY}px`;
                        tooltipDiv.style.left = `${rect.left + window.scrollX}px`;
                        tooltipDiv.style.display = 'block';
                    }
                });
            });
            document.addEventListener('click', function () {
                tooltipDiv.style.display = 'none';
            });
            tooltipDiv.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        });
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

    const masterKeyInput = document.getElementById('masterKeyGlobal');
    masterKeyInput.addEventListener('input', function () {
        if (masterKeyInput.value.length > 0 && masterKeyInput.value.length !== 16) {
            masterKeyInput.classList.add('input-error');
        } else {
            masterKeyInput.classList.remove('input-error');
        }
    });

    setupGenericTooltips();
});