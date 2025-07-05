import re
import pexpect
from fastapi import FastAPI, Query
from fastapi.responses import PlainTextResponse, FileResponse
from fastapi.staticfiles import StaticFiles

NO_AUTH = " --no-auth"

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

pm3 = None  # global variable to hold pexpect spawn instance

# Compile regex for cleaning
ansi_escape_re = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
clock_emoji_re = re.compile(r'[\U0001F550-\U0001F567]')


def clean_output(text: str) -> str:
    text = ansi_escape_re.sub('', text)
    text = clock_emoji_re.sub('', text)
    return '\n'.join(line.rstrip() for line in text.splitlines()).strip()


def send_command(cmd: str) -> str:
    global pm3
    if pm3 is None or not pm3.isalive():
        return "Proxmark3 shell is not running. Please start it first."
    pm3.sendline(cmd)
    pm3.expect(r'pm3 -->')
    return clean_output(pm3.before)


@app.get("/", response_class=FileResponse)
def serve_home():
    return FileResponse("static/index.html")


# New endpoint to Start Proxmark3
@app.get("/start-pm3", response_class=PlainTextResponse)
def start_pm3(path: str = Query('../../proxmark3/pm3', description="Path to proxmark3 executable")):
    global pm3
    if pm3 is not None and pm3.isalive():
        return "Proxmark3 shell already running."
    try:
        pm3 = pexpect.spawn(path, timeout=20, encoding='utf-8')
        pm3.expect(r'pm3 -->')
        return f"Started Proxmark3 shell at path: {path}"
    except pexpect.ExceptionPexpect as e:
        pm3 = None
        return f"Failed to Start Proxmark3: {e}"


@app.get("/hf/search", response_class=PlainTextResponse)
def hf_search():
    return send_command("hf search")


@app.get("/hf/mfdes/freemem", response_class=PlainTextResponse)
def mfdes_freemem(no_auth: bool = Query(False)):
    cmd = "hf mfdes freemem"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@app.get("/hf/mfdes/info", response_class=PlainTextResponse)
def hf_mfdes_info():
    return send_command("hf mfdes info")


@app.get("/hf/mfdes/lsapp", response_class=PlainTextResponse)
def hf_mfdes_lsapp(no_auth: bool = Query(False)):
    cmd = "hf mfdes lsapp"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@app.get("/hf/mfdes/get-default", response_class=PlainTextResponse)
def hf_mfdes_get_default():
    return send_command("hf mfdes default")


@app.get("/hf/mfdes/set-default", response_class=PlainTextResponse)
def hf_mfdes_default(
        key: str = Query(..., description="Hex key"),
        type: str = Query("AES", regex="^(DES|2TDEA|3TDEA|AES)$", description="Crypto type")
):
    cmd = f"hf mfdes default -n 0 -t {type} -k {key}"
    return send_command(cmd)


@app.get("/hf/mfdes/getappnames", response_class=PlainTextResponse)
def hf_mfdes_getappnames(noauth: bool = Query(False)):
    cmd = "hf mfdes getappnames"
    if noauth:
        cmd += NO_AUTH
    return send_command(cmd)


@app.get("/hf/mfdes/getfileids", response_class=PlainTextResponse)
def get_file_ids(aid: str, no_auth: bool = Query(False)):
    cmd = f"hf mfdes getfileids --aid {aid}"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@app.get("/hf/mfdes/read", response_class=PlainTextResponse)
def mfdes_read(aid: str, fid: str, no_auth: bool = Query(False)):
    cmd = f"hf mfdes read --aid {aid} --fid {fid}"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@app.get("/hf/mfdes/createapp", response_class=PlainTextResponse)
def mfdes_createapp(aid: str, fid: str, dfname: str, dstalgo: str):
    # ks1 and ks2 fixed as per your example
    ks1 = "0B"
    ks2 = "AE"
    cmd = f"hf mfdes createapp --aid {aid} --fid {fid} --dfname {dfname} --dstalgo {dstalgo} --ks1 {ks1} --ks2 {ks2}"
    return send_command(cmd)


@app.get("/hf/mfdes/changekey", response_class=PlainTextResponse)
def change_app_key(aid: str, newkey: str, key_type: str = "AES"):
    key = "00000000000000000000000000000000"  # Constant current key
    cmd = f"hf mfdes changekey --aid {aid} -t {key_type} --key {key} --newkey {newkey}"
    return send_command(cmd)


@app.get("/hf/mfdes/createfile", response_class=PlainTextResponse)
def mfdes_createfile(aid: str):
    cmd = (
        f"hf mfdes createfile --aid {aid} --fid 01 --isofid 0001 --size 000100 "
        f"--rrights key0 --wrights key0 --rwrights key0 --chrights key0"
    )
    return send_command(cmd)


@app.get("/hf/mfdes/write", response_class=PlainTextResponse)
def mfdes_write(aid: str, fid: str, data: str, offset: str = "000000"):
    cmd = f"hf mfdes write --aid {aid} --fid {fid} -d {data} -o {offset}"
    return send_command(cmd)
