import threading
import webview
import uvicorn
from main import app  # Your FastAPI app


def run_fastapi():
    uvicorn.run(app, host='127.0.0.1', port=8000, log_level="info")


if __name__ == '__main__':
    server_thread = threading.Thread(target=run_fastapi, daemon=True)
    server_thread.start()

    webview.create_window(
        'Proxmark3 MIFARE DESFire Command Interface',
        'http://127.0.0.1:8000',
        width=1600,
        height=1200,
        resizable=True
    )
    webview.start()