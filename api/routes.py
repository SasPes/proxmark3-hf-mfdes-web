from flask import Blueprint, request, send_file, Response
from api.utils import logging, clean_output, NO_AUTH, DEFAULT_AES_KEY, DEFAULT_DES_KEY, AES, CRYPTO_TYPE_REGEX
import pexpect
import re

bp = Blueprint('routes', __name__)
pm3 = None

def send_command(cmd: str, logs: bool = False) -> str:
    global pm3
    if pm3 is None or not pm3.isalive():
        return "Proxmark3 shell is not running. Please start it first."
    if logs:
        logging.info(f'COMMAND: {cmd}')
    pm3.sendline(cmd)
    pm3.expect(r'pm3 -->')
    output = clean_output(pm3.before)
    if logs:
        logging.info(f'OUTPUT: {output}')
    return output

@bp.route("/", methods=["GET"])
def serve_home():
    return send_file("static/index.html")

@bp.route("/start-pm3", methods=["GET"])
def start_pm3():
    global pm3
    path = request.args.get('path', '../proxmark3/pm3')
    if pm3 is not None and pm3.isalive():
        return Response("Proxmark3 shell already running.", mimetype="text/plain")
    try:
        pm3 = pexpect.spawn(path, timeout=20, encoding='utf-8')
        pm3.expect(r'pm3 -->')
        return Response(f"Started Proxmark3 shell at path: {path}", mimetype="text/plain")
    except pexpect.ExceptionPexpect as e:
        pm3 = None
        return Response(f"Failed to Start Proxmark3: {e}", mimetype="text/plain")

@bp.route("/hf/search", methods=["GET"])
def hf_search():
    logs = request.args.get('logs', 'false').lower() == 'true'
    return Response(send_command("hf search", logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/freemem", methods=["GET"])
def mfdes_freemem():
    no_auth = request.args.get('no_auth', 'false').lower() == 'true'
    logs = request.args.get('logs', 'false').lower() == 'true'
    cmd = "hf mfdes freemem"
    if no_auth:
        cmd += NO_AUTH
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/info", methods=["GET"])
def hf_mfdes_info():
    logs = request.args.get('logs', 'false').lower() == 'true'
    return Response(send_command("hf mfdes info", logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/lsapp", methods=["GET"])
def hf_mfdes_lsapp():
    no_auth = request.args.get('no_auth', 'false').lower() == 'true'
    logs = request.args.get('logs', 'false').lower() == 'true'
    cmd = "hf mfdes lsapp"
    if no_auth:
        cmd += NO_AUTH
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/get-default", methods=["GET"])
def hf_mfdes_get_default():
    logs = request.args.get('logs', 'false').lower() == 'true'
    return Response(send_command("hf mfdes default", logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/set-default", methods=["GET"])
def hf_mfdes_default():
    key = request.args.get('key')
    type_ = request.args.get('type', AES)
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not key or not re.match(CRYPTO_TYPE_REGEX, type_):
        return Response("Invalid parameters", mimetype="text/plain")
    cmd = f"hf mfdes default -n 0 -t {type_} -k {key}"
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/changekey-master", methods=["GET"])
def changekey_master():
    newalgo = request.args.get('newalgo', AES)
    newkey = request.args.get('newkey')
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not newkey:
        return Response("Missing newkey", mimetype="text/plain")
    t = "des"
    cmd = f"hf mfdes changekey -t {t} --newalgo {newalgo} --newkey {newkey}"
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/changekey-master-default", methods=["GET"])
def changekey_master_default():
    oldalgo = request.args.get('oldalgo', AES)
    oldkey = request.args.get('oldkey')
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not oldkey:
        return Response("Missing oldkey", mimetype="text/plain")
    cmd = f"hf mfdes changekey -t {oldalgo} -k {oldkey} --newalgo des --newkey {DEFAULT_DES_KEY}"
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/getappnames", methods=["GET"])
def hf_mfdes_getappnames():
    noauth = request.args.get('noauth', 'false').lower() == 'true'
    logs = request.args.get('logs', 'false').lower() == 'true'
    cmd = "hf mfdes getappnames"
    if noauth:
        cmd += NO_AUTH
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/getaids", methods=["GET"])
def hf_mfdes_getaids():
    noauth = request.args.get('noauth', 'false').lower() == 'true'
    logs = request.args.get('logs', 'false').lower() == 'true'
    cmd = "hf mfdes getaids"
    if noauth:
        cmd += NO_AUTH
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/getfileids", methods=["GET"])
def get_file_ids():
    aid = request.args.get('aid')
    no_auth = request.args.get('no_auth', 'false').lower() == 'true'
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not aid:
        return Response("Missing aid", mimetype="text/plain")
    cmd = f"hf mfdes getfileids --aid {aid}"
    if no_auth:
        cmd += NO_AUTH
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/read", methods=["GET"])
def mfdes_read():
    aid = request.args.get('aid')
    fid = request.args.get('fid')
    no_auth = request.args.get('no_auth', 'false').lower() == 'true'
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not aid or not fid:
        return Response("Missing aid or fid", mimetype="text/plain")
    cmd = f"hf mfdes read --aid {aid} --fid {fid}"
    if no_auth:
        cmd += NO_AUTH
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/createapp", methods=["GET"])
def mfdes_createapp():
    aid = request.args.get('aid')
    fid = request.args.get('fid')
    dfname = request.args.get('dfname')
    dstalgo = request.args.get('dstalgo')
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not all([aid, fid, dfname, dstalgo]):
        return Response("Missing parameters", mimetype="text/plain")
    ks1 = "09"
    ks2 = "AE"
    cmd = f"hf mfdes createapp --aid {aid} --fid {fid} --dfname {dfname} --dstalgo {dstalgo} --ks1 {ks1} --ks2 {ks2}"
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/changekey", methods=["GET"])
def change_app_key():
    aid = request.args.get('aid')
    newkey = request.args.get('newkey')
    key_type = request.args.get('key_type', AES)
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not aid or not newkey:
        return Response("Missing aid or newkey", mimetype="text/plain")
    cmd = f"hf mfdes changekey --aid {aid} -t {key_type} --key {DEFAULT_AES_KEY} --newkey {newkey}"
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/deleteapp", methods=["GET"])
def mfdes_deleteapp():
    aid = request.args.get('aid')
    no_auth = request.args.get('no_auth', 'false').lower() == 'true'
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not aid:
        return Response("Missing aid", mimetype="text/plain")
    cmd = f"hf mfdes deleteapp --aid {aid}"
    if no_auth:
        cmd += NO_AUTH
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/createfile", methods=["GET"])
def mfdes_createfile():
    aid = request.args.get('aid')
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not aid:
        return Response("Missing aid", mimetype="text/plain")
    cmd = (
        f"hf mfdes createfile --aid {aid} --fid 01 --isofid 0001 --size 000100 "
        f"--rrights key0 --wrights key0 --rwrights key0 --chrights key0"
    )
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/write", methods=["GET"])
def mfdes_write():
    aid = request.args.get('aid')
    fid = request.args.get('fid')
    data = request.args.get('data')
    offset = request.args.get('offset', "000000")
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not aid or not fid or not data:
        return Response("Missing parameters", mimetype="text/plain")
    cmd = f"hf mfdes write --aid {aid} --fid {fid} -d {data} -o {offset}"
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/deletefile", methods=["GET"])
def mfdes_deletefile():
    aid = request.args.get('aid')
    fid = request.args.get('fid')
    no_auth = request.args.get('no_auth', 'false').lower() == 'true'
    logs = request.args.get('logs', 'false').lower() == 'true'
    if not aid or not fid:
        return Response("Missing aid or fid", mimetype="text/plain")
    cmd = f"hf mfdes deletefile --aid {aid} --fid {fid}"
    if no_auth:
        cmd += NO_AUTH
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")

@bp.route("/hf/mfdes/formatpicc", methods=["GET"])
def format_picc():
    no_auth = request.args.get('no_auth', 'false').lower() == 'true'
    logs = request.args.get('logs', 'false').lower() == 'true'
    cmd = "hf mfdes formatpicc"
    if no_auth:
        cmd += NO_AUTH
    return Response(send_command(cmd, logs=logs), mimetype="text/plain")