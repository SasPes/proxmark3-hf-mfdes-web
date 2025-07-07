const RECOVERY_CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

async function runSetDefaultMasterKey() {
    const output = document.getElementById('output');
    output.innerHTML = `<pre>Setting default master key (to DES/0...0)...</pre>`;
    // Get oldalgo and oldkey from UI
    const masterKey = document.getElementById('masterKeyDefaultOldKey').value;
    const oldalgo = document.getElementById('masterKeyCurrentAlgo')?.value || 'aes';
    let hexKey = '';
    for (let i = 0; i < masterKey.length; i++) {
        hexKey += masterKey.charCodeAt(i).toString(16).padStart(2, '0');
    }
    const endpoint = `/hf/mfdes/changekey-master-default?oldalgo=${encodeURIComponent(oldalgo)}&oldkey=${encodeURIComponent(hexKey)}`;
    output.innerHTML = `<pre>Running ${endpoint} ... please wait.</pre>`;
    try {
        const res = await fetch(endpoint);
        const text = await res.text();
        output.innerHTML = `<pre>${highlightOutput(text)}</pre>`;
    } catch (err) {
        output.innerHTML = `<pre>Error: ${escapeHTML(err.message)}</pre>`;
    }
}

async function runSetMasterKeyRecoveryCodes() {
    const key = document.getElementById('recoveryEncKey').value;
    const keyConfirm = document.getElementById('recoveryEncKeyConfirm').value;
    const output = document.getElementById('output');
    if (!key || !keyConfirm) {
        output.innerHTML = '<pre>Please enter and confirm the encryption key.</pre>';
        return;
    }
    if (key !== keyConfirm) {
        output.innerHTML = '<pre>Encryption keys do not match.</pre>';
        return;
    }

    const logs = [];

    function updateOutput() {
        output.innerHTML = logs.slice().reverse().join('');
    }

    function stepBox(title) {
        return `<div class="step-box">${title}</div>`;
    }

    function stepBoxError(title) {
        return `<div class="step-error">${title}</div>`;
    }

    function isError(text) {
        return /\[\!\]/.test(text) || /error/i.test(text);
    }

    // Step 1: Start Proxmark3
    let step = stepBox('Step 1: Starting Proxmark3...');
    let res = await fetch(`/start-pm3`);
    let text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    // Step 2: Set Master Key
    step = stepBox('Step 2: Setting Master Key...');
    let hexKey = '';
    for (let i = 0; i < key.length; i++) {
        hexKey += key.charCodeAt(i).toString(16).padStart(2, '0');
    }
    res = await fetch(`/hf/mfdes/changekey-master?newalgo=aes&newkey=${encodeURIComponent(hexKey)}`);
    text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    // Step 3: Set profile
    step = stepBox('Step 3: Setting profile...');
    res = await fetch(`/hf/mfdes/set-default?type=AES&key=${encodeURIComponent(hexKey)}`);
    text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    logs.push(stepBox('Encryption steps completed.') + '<br>');
    updateOutput();
}

async function saveRecoveryCodes() {
    const appName = document.getElementById('recoveryAppName').value.trim();
    const key = document.getElementById('recoveryEncKey').value;
    const keyConfirm = document.getElementById('recoveryEncKeyConfirm').value;
    const codes = document.getElementById('recoveryCodes').value.trim();
    const output = document.getElementById('output');

    if (!appName || !key || !keyConfirm || !codes) {
        output.innerHTML = '<pre>Please fill in all fields.</pre>';
        return;
    }
    if (key !== keyConfirm) {
        output.innerHTML = '<pre>Encryption keys do not match.</pre>';
        return;
    }

    const logs = [];

    function updateOutput() {
        output.innerHTML = logs.slice().reverse().join('');
    }

    function stepBox(title) {
        return `<div class="step-box">${title}</div>`;
    }

    function stepBoxError(title) {
        return `<div class="step-error">${title}</div>`;
    }

    function isError(text) {
        return /\[\!\]/.test(text) || /error/i.test(text);
    }

    // Step 1: Check if app exists, create if not
    let step = stepBox('Step 1: Checking/Creating App...');
    let getAppsRes = await fetch(`/hf/mfdes/getappnames`);
    let getAppsText = await getAppsRes.text();
    logs.push(`${step}<pre>${highlightOutput(getAppsText)}</pre>`);
    updateOutput();
    if (isError(getAppsText)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    // Parse existing apps for AID and FID
    const appRegex = /\[=\] AID: (\d+) ISO file id: (\d+) ISO DF name\[\d+\]:\s*(.+)$/gm;
    let match, foundAid = null, foundFid = null, maxAid = 0, maxFid = 0;
    while ((match = appRegex.exec(getAppsText)) !== null) {
        const aidNum = parseInt(match[1], 10);
        const fidNum = parseInt(match[2], 10);
        if (aidNum > maxAid) maxAid = aidNum;
        if (fidNum > maxFid) maxFid = fidNum;
        if (match[3].trim() === appName) {
            foundAid = match[1].padStart(6, '0');
            foundFid = match[2].padStart(4, '0');
        }
    }
    let aid = foundAid;
    let fid = foundFid;
    let appAlreadyExists = false;
    if (!aid) {
        aid = (maxAid + 1).toString().padStart(6, '0');
        fid = (maxFid + 1).toString().padStart(4, '0');
        let createRes = await fetch(`/hf/mfdes/createapp?aid=${aid}&fid=${fid}&dfname=${encodeURIComponent(appName)}&dstalgo=AES`);
        let createText = await createRes.text();
        logs.push(stepBox(`Creating App with AID ${aid} and FID ${fid}...`) + `<pre>${highlightOutput(createText)}</pre>`);
        updateOutput();
        if (isError(createText)) {
            logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
            updateOutput();
            return;
        }
    } else {
        appAlreadyExists = true;
        logs.push(stepBox(`App "${appName}" already exists with AID ${aid} and FID ${fid}. Skipping creation, set key, and file.`) + '<br>');
        updateOutput();
    }

// Only set app key and create file if app was just created
    if (!appAlreadyExists) {
        // Step 2: Set App Key
        step = stepBox('Step 2: Setting App Key...');
        let hexKey = '';
        for (let i = 0; i < key.length; i++) {
            hexKey += key.charCodeAt(i).toString(16).padStart(2, '0');
        }
        let res = await fetch(`/hf/mfdes/changekey?aid=${aid}&newkey=${encodeURIComponent(hexKey)}`);
        let text = await res.text();
        logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
        updateOutput();
        if (isError(text)) {
            logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
            updateOutput();
            return;
        }

        // Step 3: Create File
        step = stepBox('Step 3: Creating File...');
        res = await fetch(`/hf/mfdes/createfile?aid=${aid}`);
        text = await res.text();
        logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
        updateOutput();
        if (isError(text)) {
            logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
            updateOutput();
            return;
        }
    }

    // Step 4: Write Recovery Codes
    step = stepBox('Step 4: Writing Recovery Codes...');
    let hexCodes = '';
    for (let i = 0; i < codes.length; i++) {
        hexCodes += codes.charCodeAt(i).toString(16).padStart(2, '0');
    }
    res = await fetch(`/hf/mfdes/write?aid=${aid}&fid=01&data=${hexCodes}&offset=000000`);
    text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    // Step 5: Read file
    step = stepBox('Step 5: Reading file...');
    res = await fetch(`/hf/mfdes/read?aid=${aid}&fid=01`);
    text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    logs.push(stepBox('All steps completed.') + '<br>');
    updateOutput();
}

function confirmCleanupCard() {
    if (confirm("Are you sure you want to wipe and restore the card?\nThis action cannot be undone!")) {
        cleanupCard();
    }
}

async function cleanupCard() {
    const output = document.getElementById('output');
    const logs = [];

    function updateOutput() {
        output.innerHTML = logs.slice().reverse().join('');
    }

    function stepBox(title) {
        return `<div class="step-box">${title}</div>`;
    }

    function stepBoxError(title) {
        return `<div class="step-error">${title}</div>`;
    }

    function isError(text) {
        return /\[\!\]/.test(text) || /error/i.test(text);
    }

    // Step 1: Check Free Memory
    let step = stepBox('Step 1: Check Free Memory');
    let res = await fetch('/hf/mfdes/freemem');
    let text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    // Step 2: Format Card
    step = stepBox('Step 2: Format Card');
    res = await fetch('/hf/mfdes/formatpicc');
    text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    // Step 3: Check Free Memory
    step = stepBox('Step 3: Check Free Memory');
    res = await fetch('/hf/mfdes/freemem');
    text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    // Step 4: Set default (DES/0...0)
    step = stepBox('Step 4: Set default (DES/0...0)');
    res = await fetch('/hf/mfdes/changekey-master-default?oldalgo=aes&oldkey=54686973206973206120746573742121'); // "This is a test!!" in hex
    text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error or card already wiped & restored!') + '<br>');
        updateOutput();
        return;
    }

    // Step 5: Set default profile
    step = stepBox('Step 5: Set default profile');
    res = await fetch('/hf/mfdes/set-default?type=DES&key=0000000000000000');
    text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();
    if (isError(text)) {
        logs.push(stepBoxError('🚩 Stopped due to error!') + '<br>');
        updateOutput();
        return;
    }

    // Step 6: Get profile
    step = stepBox('Step 6: Get profile');
    res = await fetch('/hf/mfdes/get-default');
    text = await res.text();
    logs.push(`${step}<pre>${highlightOutput(text)}</pre>`);
    updateOutput();

    logs.push(stepBox('Wipe & Restore Card completed.') + '<br>');
    updateOutput();
}

function generateRandomRecoveryCodes() {
    const appNames = ['github', 'google', 'amazon', 'microsoft', 'apple'];
    const randomApp = appNames[Math.floor(Math.random() * appNames.length)];
    const randomSuffix = Array.from({length: 4}, () =>
        RECOVERY_CODE_CHARS[Math.floor(Math.random() * RECOVERY_CODE_CHARS.length)]
    ).join('');
    document.getElementById('recoveryAppName').value = `${randomApp}-${randomSuffix}`;

    function randomCode() {
        const part = () => Array.from({length: 5}, () => RECOVERY_CODE_CHARS[Math.floor(Math.random() * RECOVERY_CODE_CHARS.length)]).join('');
        return `${part()}-${part()}`;
    }

    const codes = Array.from({length: 16}, randomCode).join('\n');
    document.getElementById('recoveryCodes').value = codes;
}