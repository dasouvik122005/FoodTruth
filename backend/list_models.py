import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GOOGLE_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
response = requests.get(url)

if response.status_code == 200:
    models = response.json().get('models', [])
    print("Available Gemma Models:")
    for model in models:
        if "gemma" in model.get('name', '').lower():
            print(f"- {model['name']} (supported_methods: {model.get('supportedGenerationMethods')})")
else:
    print("Error fetching models:", response.text)
