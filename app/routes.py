import logging
import requests
from flask import Blueprint, render_template, request, jsonify

bp = Blueprint('main', __name__)

API_USER   = "33758403"
API_SECRET = "bJzK8utPCbkvAcJXbuDvnbyjGg7tBXDv"

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/predict', methods=['POST'])
def predict():
    f = request.files.get('file')
    if not f:
        return jsonify(error="No file uploaded"), 400

    # forward upload to Sightengine asking for both deepfake & genai
    files = {'media': (f.filename, f.stream, f.mimetype)}
    data  = {
        'models':     'deepfake,genai',
        'api_user':   API_USER,
        'api_secret': API_SECRET
    }

    try:
        resp = requests.post(
            'https://api.sightengine.com/1.0/check.json',
            files=files, data=data, timeout=30
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        logging.exception("Sightengine request failed")
        return jsonify(error="Upstream request failed"), 502

    body = resp.json().get('type', {})
    genai_score    = body.get('ai_generated', 0.0)
    deepfake_score = body.get('deepfake',      0.0)

    # build nested structure for front‑end
    out = {
        "Overall": {
            "Likely AI‑generated": f"{round(genai_score*100,2)}%"
        },
        "GenAI": {
            "GenAI":             f"{round(genai_score*100,2)}%",
            "Face manipulation": f"{round(deepfake_score*100,2)}%"
        },
        "Diffusion": {
            "DALL‑E":           "0%",
            "Reve":             "0%",
            "Firefly":          "0%",
            "Flux":             "0%",
            "GPT‑4o":           "0%",
            "Ideogram":         "0%",
            "Imagen":           "0%",
            "MidJourney":       "0%",
            "Recraft":          "0%",
            "Stable Diffusion": "0%",
            "Other":            "0%"
        },
        "GAN": {
            "StyleGAN": "0%"
        },
        "Other": {
            "Face manipulation": "0%"
        }
    }

    return jsonify(out)
