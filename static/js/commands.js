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