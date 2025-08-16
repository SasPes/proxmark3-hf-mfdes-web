from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from api.routes import router
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.include_router(router)