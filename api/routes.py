from fastapi import APIRouter, Query
from fastapi.responses import PlainTextResponse, FileResponse
from api.utils import logging, clean_output, NO_AUTH, DEFAULT_AES_KEY, DEFAULT_DES_KEY
import pexpect

router = APIRouter()
pm3 = None  # global variable for Proxmark3 shell


def send_command(cmd: str) -> str:
    global pm3
    if pm3 is None or not pm3.isalive():
        return "Proxmark3 shell is not running. Please start it first."
    logging.info(f'COMMAND: {cmd}')
    pm3.sendline(cmd)
    pm3.expect(r'pm3 -->')
    output = clean_output(pm3.before)
    logging.info(f'OUTPUT: {output}')
    return output


@router.get("/", response_class=FileResponse)
def serve_home():
    return FileResponse("static/index.html")


@router.get("/start-pm3", response_class=PlainTextResponse)
def start_pm3(path: str = Query('../proxmark3/pm3', description="Path to proxmark3 executable")):
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


@router.get("/hf/search", response_class=PlainTextResponse)
def hf_search():
    return send_command("hf search")


@router.get("/hf/mfdes/freemem", response_class=PlainTextResponse)
def mfdes_freemem(no_auth: bool = Query(False)):
    cmd = "hf mfdes freemem"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@router.get("/hf/mfdes/info", response_class=PlainTextResponse)
def hf_mfdes_info():
    return send_command("hf mfdes info")


@router.get("/hf/mfdes/lsapp", response_class=PlainTextResponse)
def hf_mfdes_lsapp(no_auth: bool = Query(False)):
    cmd = "hf mfdes lsapp"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@router.get("/hf/mfdes/get-default", response_class=PlainTextResponse)
def hf_mfdes_get_default():
    return send_command("hf mfdes default")


@router.get("/hf/mfdes/set-default", response_class=PlainTextResponse)
def hf_mfdes_default(
        key: str = Query(..., description="Hex key"),
        type: str = Query("AES", regex="^(DES|2TDEA|3TDEA|AES)$", description="Crypto type")
):
    cmd = f"hf mfdes default -n 0 -t {type} -k {key}"
    return send_command(cmd)


@router.get("/hf/mfdes/changekey-master", response_class=PlainTextResponse)
def changekey_master(
        newalgo: str = Query("aes"),
        newkey: str = Query(...)
):
    t = "des"
    cmd = f"hf mfdes changekey -t {t} --newalgo {newalgo} --newkey {newkey}"
    return send_command(cmd)


@router.get("/hf/mfdes/changekey-master-default", response_class=PlainTextResponse)
def changekey_master_default(
        oldalgo: str = Query("aes"),
        oldkey: str = Query(...)
):
    cmd = f"hf mfdes changekey -t {oldalgo} -k {oldkey} --newalgo des --newkey {DEFAULT_DES_KEY}"
    return send_command(cmd)


@router.get("/hf/mfdes/getappnames", response_class=PlainTextResponse)
def hf_mfdes_getappnames(noauth: bool = Query(False)):
    cmd = "hf mfdes getappnames"
    if noauth:
        cmd += NO_AUTH
    return send_command(cmd)


@router.get("/hf/mfdes/getfileids", response_class=PlainTextResponse)
def get_file_ids(aid: str, no_auth: bool = Query(False)):
    cmd = f"hf mfdes getfileids --aid {aid}"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@router.get("/hf/mfdes/read", response_class=PlainTextResponse)
def mfdes_read(aid: str, fid: str, no_auth: bool = Query(False)):
    cmd = f"hf mfdes read --aid {aid} --fid {fid}"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@router.get("/hf/mfdes/createapp", response_class=PlainTextResponse)
def mfdes_createapp(aid: str, fid: str, dfname: str, dstalgo: str):
    # ks1 and ks2 fixed as per your example
    ks1 = "0B"
    ks2 = "AE"
    cmd = f"hf mfdes createapp --aid {aid} --fid {fid} --dfname {dfname} --dstalgo {dstalgo} --ks1 {ks1} --ks2 {ks2}"
    return send_command(cmd)


@router.get("/hf/mfdes/changekey", response_class=PlainTextResponse)
def change_app_key(aid: str, newkey: str, key_type: str = "AES"):
    cmd = f"hf mfdes changekey --aid {aid} -t {key_type} --key {DEFAULT_AES_KEY} --newkey {newkey}"
    return send_command(cmd)


@router.get("/hf/mfdes/deleteapp", response_class=PlainTextResponse)
def mfdes_deleteapp(aid: str, no_auth: bool = Query(False)):
    cmd = f"hf mfdes deleteapp --aid {aid}"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@router.get("/hf/mfdes/createfile", response_class=PlainTextResponse)
def mfdes_createfile(aid: str):
    cmd = (
        f"hf mfdes createfile --aid {aid} --fid 01 --isofid 0001 --size 000100 "
        f"--rrights key0 --wrights key0 --rwrights key0 --chrights key0"
    )
    return send_command(cmd)


@router.get("/hf/mfdes/write", response_class=PlainTextResponse)
def mfdes_write(aid: str, fid: str, data: str, offset: str = "000000"):
    cmd = f"hf mfdes write --aid {aid} --fid {fid} -d {data} -o {offset}"
    return send_command(cmd)


@router.get("/hf/mfdes/deletefile", response_class=PlainTextResponse)
def mfdes_deletefile(aid: str, fid: str, no_auth: bool = Query(False)):
    cmd = f"hf mfdes deletefile --aid {aid} --fid {fid}"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)


@router.get("/hf/mfdes/formatpicc", response_class=PlainTextResponse)
def format_picc(no_auth: bool = Query(False)):
    cmd = "hf mfdes formatpicc"
    if no_auth:
        cmd += NO_AUTH
    return send_command(cmd)
