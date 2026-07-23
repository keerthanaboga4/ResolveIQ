from fastapi import FastAPI
from gemini_service import classify_grievance

app = FastAPI()

@app.get("/")
def root():
    return {"message": "ResolveIQ backend is running"}

@app.post("/test-classify")
def test_classify(text: str):
    return {"category": classify_grievance(text)}
    