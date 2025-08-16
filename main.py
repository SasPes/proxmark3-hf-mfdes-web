from flask import Flask, send_from_directory
from api.routes import bp

app = Flask(__name__, static_folder='static')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

app.register_blueprint(bp)

if __name__ == '__main__':
    app.run()