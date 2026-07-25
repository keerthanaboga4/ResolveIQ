from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from gemini_service import classify_grievance, chatbot_response
from bigquery_service import save_grievance, get_all_grievances, get_category_stats, detect_hotspots, detect_smart_hotspots, get_recent_complaints_summary
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "ResolveIQ backend is running"}

@app.post("/test-classify")
def test_classify(text: str, language: str = "en"):
    return {"category": classify_grievance(text, language)}

@app.post("/submit-grievance")
def submit_grievance(text: str, language: str = "en"):
    category, location = classify_grievance(text, language)
    saved = save_grievance(text, category, location, language)
    return saved

@app.get("/get-grievances")
def get_grievances():
    return get_all_grievances()

@app.get("/category-stats")
def category_stats():
    return get_category_stats()

@app.get("/hotspots")
def hotspots():
    return detect_hotspots()

@app.get("/smart-hotspots")
def smart_hotspots():
    return detect_smart_hotspots()

@app.post("/chatbot")
def chatbot(question: str, language: str = "en"):
    stats = get_category_stats()
    hotspots_data = detect_smart_hotspots()
    recent_complaints = get_recent_complaints_summary(50)
    
    complaints_text = "\n".join([
        f"- [{c['category']}] {c['text']} (Location: {c['location']}, Status: {c['status']})"
        for c in recent_complaints
    ])
    
    context = f"""Category statistics: {stats}
Hotspots: {hotspots_data}

Individual complaints:
{complaints_text}"""
    
    answer = chatbot_response(question, context, language)
    return {"answer": answer}