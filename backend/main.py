from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from gemini_service import classify_grievance
from bigquery_service import save_grievance
from bigquery_service import get_all_grievances
from bigquery_service import get_category_stats
from bigquery_service import detect_hotspots

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
def test_classify(text: str):
    return {"category": classify_grievance(text)}

@app.post("/submit-grievance")
def submit_grievance(text: str):
    category = classify_grievance(text)
    saved = save_grievance(text, category)
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