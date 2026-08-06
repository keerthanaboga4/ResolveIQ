from supabase import create_client
import uuid
import hashlib
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

client = create_client(SUPABASE_URL, SUPABASE_KEY)

DEFAULT_OFFICERS = {
    "Water Board": "Water Board Duty Officer",
    "Electricity Board": "Electricity Board Duty Officer",
    "Municipal Corporation": "Municipal Duty Officer",
    "Public Works": "Public Works Duty Officer",
    "Police": "Station House Officer",
    "Health Department": "Health Department Officer",
    "Education Department": "Education Department Officer",
    "Unspecified": "General Grievance Cell"
}

def get_assigned_officer(mentioned_officer, department, district):
    if mentioned_officer and mentioned_officer != "None":
        return mentioned_officer
    base = DEFAULT_OFFICERS.get(department, "General Grievance Cell")
    return f"{base} - {district}" if district else base


def get_cluster_info(category, location):
    if location == "Unspecified":
        return False, None
    result = client.table("grievances").select("id", count="exact").eq("category", category).eq("location", location).execute()
    existing_count = result.count or 0
    is_systemic = existing_count >= 1
    cluster_id = hashlib.md5(f"{category}_{location}".encode()).hexdigest()[:8] if is_systemic else None
    return is_systemic, cluster_id


def save_grievance(text: str, citizen_name: str, phone: str, district: str, state: str, parsed: dict, language: str = "en"):
    grievance_id = str(uuid.uuid4())
    assigned = get_assigned_officer(parsed["mentioned_officer"], parsed["department"], district)
    is_systemic, cluster_id = get_cluster_info(parsed["category"], parsed["location"])

    row = {
        "id": grievance_id,
        "text": text,
        "citizen_name": citizen_name,
        "phone": phone,
        "district": district,
        "state": state,
        "category": parsed["category"],
        "location": parsed["location"],
        "department": parsed["department"],
        "priority_score": parsed["priority_score"],
        "sentiment_score": parsed["sentiment_score"],
        "assigned_officer": assigned,
        "predicted_resolution_days": parsed["predicted_resolution_days"],
        "is_systemic": is_systemic,
        "cluster_id": cluster_id,
        "status": "Pending",
        "language": language,
    }
    client.table("grievances").insert(row).execute()

    if parsed["mentioned_officer"] and parsed["mentioned_officer"] != "None":
        try:
            update_officer_record(parsed["mentioned_officer"], parsed["department"], district, parsed["category"])
        except Exception as e:
            print("Officer update error:", e)

    return row


def update_officer_record(officer_name, department, district, category):
    total_result = client.table("grievances").select("id", count="exact").eq("assigned_officer", officer_name).execute()
    total_complaints = total_result.count or 1

    bribery_result = client.table("grievances").select("id", count="exact").eq("assigned_officer", officer_name).eq("category", "Corruption").execute()
    bribery_count = bribery_result.count or 0

    risk_score = min((bribery_count / max(total_complaints, 1)) * 100, 100)
    grade = "Poor" if risk_score > 30 else ("Average" if risk_score > 10 else "Good")

    officer_row = {
        "officer_id": officer_name.replace(" ", "_").lower(),
        "officer_name": officer_name,
        "department": department,
        "district": district,
        "total_complaints": total_complaints,
        "bribery_count": bribery_count,
        "corruption_risk_score": risk_score,
        "performance_grade": grade
    }
    client.table("officers").upsert(officer_row).execute()

    if bribery_count >= 2:
        create_fraud_alert(officer_name, department, district, bribery_count)


def create_fraud_alert(officer_name, department, district, evidence_count):
    alert_row = {
        "officer_id": officer_name.replace(" ", "_").lower(),
        "officer_name": officer_name,
        "department": department,
        "district": district,
        "alert_type": "Repeated Corruption Complaints",
        "evidence_count": evidence_count,
        "description": f"{officer_name} has {evidence_count} corruption-related complaints",
        "severity": "High" if evidence_count >= 3 else "Medium",
    }
    client.table("fraud_alerts").insert(alert_row).execute()


def get_all_grievances():
    result = client.table("grievances").select("*").order("created_at", desc=True).execute()
    return result.data


def get_category_stats():
    result = client.table("grievances").select("category").execute()
    counts = {}
    for row in result.data:
        cat = row["category"]
        counts[cat] = counts.get(cat, 0) + 1
    return [{"category": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]


def detect_hotspots():
    result = client.table("grievances").select("category").execute()
    counts = {}
    for row in result.data:
        cat = row["category"]
        counts[cat] = counts.get(cat, 0) + 1
    return [{"category": k, "complaint_count": v} for k, v in counts.items() if v >= 2]


def detect_smart_hotspots():
    result = client.table("grievances").select("category, location").neq("location", "Unspecified").execute()
    counts = {}
    for row in result.data:
        key = (row["category"], row["location"])
        counts[key] = counts.get(key, 0) + 1
    return [{"category": k[0], "location": k[1], "complaint_count": v} for k, v in counts.items() if v >= 2]


def get_recent_complaints_summary(limit: int = 50):
    result = client.table("grievances").select("text, category, location, status").order("created_at", desc=True).limit(limit).execute()
    return result.data


def get_corruption_alerts():
    officers = client.table("officers").select("*").order("corruption_risk_score", desc=True).execute()
    alerts = client.table("fraud_alerts").select("*").order("created_at", desc=True).execute()
    return {"officers": officers.data, "alerts": alerts.data}


def get_district_stats():
    result = client.table("grievances").select("district, priority_score").execute()
    stats = {}
    for row in result.data:
        d = row["district"]
        if not d:
            continue
        if d not in stats:
            stats[d] = {"count": 0, "total_priority": 0}
        stats[d]["count"] += 1
        stats[d]["total_priority"] += row["priority_score"] or 0
    return [
        {"district": d, "complaint_count": v["count"], "avg_priority": v["total_priority"] / v["count"]}
        for d, v in sorted(stats.items(), key=lambda x: -x[1]["count"])
    ]


def get_systemic_issues():
    result = client.table("grievances").select("category, location, district").neq("location", "Unspecified").execute()
    counts = {}
    for row in result.data:
        key = (row["category"], row["location"], row["district"])
        counts[key] = counts.get(key, 0) + 1
    return [
        {"category": k[0], "location": k[1], "district": k[2], "complaint_count": v}
        for k, v in counts.items() if v >= 2
    ]


def update_status(grievance_id: str, new_status: str):
    update_data = {"status": new_status}
    if new_status == "Resolved":
        update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
    client.table("grievances").update(update_data).eq("id", grievance_id).execute()
    return {"id": grievance_id, "status": new_status}