import vertexai
from vertexai.generative_models import GenerativeModel

vertexai.init(project="resolve-iq-503213", location="us-central1")
model = GenerativeModel("gemini-2.5-flash")

def classify_grievance(text: str):
    prompt = f"Classify this complaint into one category (Corruption, Infrastructure, Sanitation, Water, Other). Return only the category name: {text}"
    response = model.generate_content(prompt)
    return response.text