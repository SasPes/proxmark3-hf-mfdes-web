import re
import os
import logging
from datetime import datetime

NO_AUTH = " --no-auth"
DEFAULT_AES_KEY = "00000000000000000000000000000000"
DEFAULT_DES_KEY = "0000000000000000"

log_dir = 'log'
os.makedirs(log_dir, exist_ok=True)
log_filename = os.path.join(log_dir, f'command_output_{datetime.now():%Y%m%d_%H%M%S}.log')

logging.basicConfig(
    filename=log_filename,
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

ansi_escape_re = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
clock_emoji_re = re.compile(r'[\U0001F550-\U0001F567]')

def clean_output(text: str) -> str:
    text = ansi_escape_re.sub('', text)
    text = clock_emoji_re.sub('', text)
    return '\n'.join(line.rstrip() for line in text.splitlines()).strip()