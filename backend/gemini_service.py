from groq import Groq
import json
import os
from dotenv import load_dotenv
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "llama-3.3-70b-versatile"

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

def classify_grievance(text: str, language: str = "en"):
    if language == "te":
        lang_hint = "The user wrote this complaint in Telugu. Understand it in Telugu, but return all values in English only."
    elif language == "hi":
        lang_hint = "The user wrote this complaint in Hindi. Understand it in Hindi, but return all values in English only."
    else:
        lang_hint = "The user wrote this complaint in English."

    prompt = f"""{lang_hint}

Analyze the following civic grievance and respond ONLY with valid JSON in this exact format:
{{
  "category": "<exactly one of: {', '.join(VALID_CATEGORIES)}>",
  "location": "<specific location, area, block, street, or landmark mentioned, or 'Unspecified' if none>",
  "priority_score": <integer 1-5, where 5 = urgent/safety risk, 1 = minor/cosmetic issue>,
  "sentiment_score": <integer 1-5, where 1 = calm/neutral tone, 5 = very frustrated/angry tone>,
  "department": "<likely responsible department: Water Board, Electricity Board, Municipal Corporation, Public Works, Police, Health Department, Education Department, or 'Unspecified'>",
  "mentioned_officer": "<specific officer name or designation if mentioned, otherwise 'None'>",
  "predicted_resolution_days": <integer estimate of days to resolve, typically 1-30>
}}

Return ONLY the JSON object, no markdown, no explanation.

Complaint: {text}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        raw = response.choices[0].message.content.strip()
        parsed = json.loads(raw)

        if parsed.get("category") not in VALID_CATEGORIES:
            parsed["category"] = "Other"
        parsed.setdefault("location", "Unspecified")
        parsed.setdefault("priority_score", 3)
        parsed.setdefault("sentiment_score", 3)
        parsed.setdefault("department", "Unspecified")
        parsed.setdefault("mentioned_officer", "None")
        parsed.setdefault("predicted_resolution_days", 7)

        return parsed

    except Exception as e:
        print("Classification error:", e)
        return {
            "category": "Other",
            "location": "Unspecified",
            "priority_score": 3,
            "sentiment_score": 3,
            "department": "Unspecified",
            "mentioned_officer": "None",
            "predicted_resolution_days": 7
        }


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

Carefully read through the actual complaint texts listed above to answer the citizen's question with specific details — don't just report counts. If the data doesn't cover their question, say so honestly.

Question: {question}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    return response.choices[0].message.content.strip()