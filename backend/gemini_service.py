import vertexai
from vertexai.generative_models import GenerativeModel

vertexai.init(project="resolve-iq-503213", location="us-central1")
model = GenerativeModel("gemini-2.5-flash")

def classify_grievance(text: str):
    prompt = f"""Classify this civic complaint into exactly ONE of these categories:
- Sewage and Drainage
- Water Supply
- Road and Infrastructure
- Electricity
- Sanitation and Garbage
- Corruption
- Public Safety
- Healthcare
- Education
- Other

Return only the category name, nothing else.

Complaint: {text}"""
    response = model.generate_content(prompt)
    return response.text.strip()