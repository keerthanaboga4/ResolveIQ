import vertexai
from vertexai.generative_models import GenerativeModel

vertexai.init(project="resolve-iq-503213", location="us-central1")
model = GenerativeModel("gemini-2.5-flash")

VALID_CATEGORIES = [
    "Sewage and Drainage",
    "Water Supply",
    "Road and Infrastructure",
    "Electricity",
    "Sanitation and Garbage",
    "Corruption",
    "Public Safety",
    "Healthcare",
    "Education",
    "Other"
]

import json

def classify_grievance(text: str, language: str = "en"):
    # Language hint for Gemini
    if language == "te":
        lang_hint = "The user wrote this complaint in Telugu. Understand it in Telugu, but return the category name in English only."
    elif language == "hi":
        lang_hint = "The user wrote this complaint in Hindi. Understand it in Hindi, but return the category name in English only."
    else:
        lang_hint = "The user wrote this complaint in English."

    prompt = f"""{lang_hint}

Analyze the following civic grievance and respond ONLY with valid JSON in this exact format:
{{"category": "<exactly one of: {', '.join(VALID_CATEGORIES)}>", "location": "<any specific location, area, block, street, or landmark mentioned in the complaint, or 'Unspecified' if none is mentioned>"}}

Return ONLY the JSON object, nothing else — no markdown, no explanation.

Complaint: {text}"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Clean up markdown formatting Gemini sometimes adds
        raw = raw.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(raw)
        category = parsed.get("category", "Other").strip()
        location = parsed.get("location", "Unspecified").strip()

        # Fallback if Gemini returns something unexpected
        if category not in VALID_CATEGORIES:
            category = "Other"

        return category, location

    except Exception as e:
        print("Classification error:", e)
        return "Other", "Unspecified"

def chatbot_response(question: str, context_data: str, language: str = "en"):
    lang_hint = {
        "te": "Respond in Telugu.",
        "hi": "Respond in Hindi.",
        "en": "Respond in English."
    }.get(language, "Respond in English.")

    prompt = f"""You are a helpful civic assistant for ResolveIQ, a citizen grievance platform.
{lang_hint}

Here is the live grievance data:
{context_data}

Carefully read through the actual complaint texts listed above to answer the citizen's question with specific details — don't just report counts. Quote or paraphrase relevant complaint details when relevant. If the data doesn't cover their question, say so honestly.

Question: {question}"""

    response = model.generate_content(prompt)
    return response.text.strip()