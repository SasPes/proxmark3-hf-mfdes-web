import threading
import webview
from main import app

def run_flask():
    app.run(host='127.0.0.1', port=5000, debug=False)

if __name__ == '__main__':
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    webview.create_window(
        'Proxmark3 MIFARE DESFire Command Interface',
        'http://127.0.0.1:5000',
        width=1600,
        height=1200
    )
    webview.start()