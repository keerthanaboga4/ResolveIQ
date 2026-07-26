from google.cloud import bigquery
import uuid
from datetime import datetime
import hashlib

client = bigquery.Client(project="resolve-iq-503213")
table_id = "resolve-iq-503213.grievance_data.grievances"
officers_table = "resolve-iq-503213.grievance_data.officers"
alerts_table = "resolve-iq-503213.grievance_data.fraud_alerts"

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

def get_cluster_info(category, location):
    if location == "Unspecified":
        return False, None

    query = f"""
        SELECT COUNT(*) as cnt
        FROM `{table_id}`
        WHERE category = @category AND location = @location
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("category", "STRING", category),
            bigquery.ScalarQueryParameter("location", "STRING", location),
        ]
    )
    result = list(client.query(query, job_config=job_config).result())
    existing_count = result[0]["cnt"] if result else 0

    is_systemic = existing_count >= 1  # this new one would make it 2+
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
        "created_at": datetime.utcnow().isoformat()
    }
    errors = client.insert_rows_json(table_id, [row])
    if errors:
        raise Exception(f"BigQuery insert error: {errors}")

    if parsed["mentioned_officer"] and parsed["mentioned_officer"] != "None":
        try:
            update_officer_record(parsed["mentioned_officer"], parsed["department"], district, parsed["category"])
        except Exception as e:
            print("Officer update error:", e)

    return row


def update_officer_record(officer_name, department, district, category):
    query = f"""
        SELECT COUNT(*) as complaint_count
        FROM `{table_id}`
        WHERE assigned_officer = @officer_name
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("officer_name", "STRING", officer_name)]
    )
    result = list(client.query(query, job_config=job_config).result())
    total_complaints = result[0]["complaint_count"] if result else 1

    corruption_query = f"""
        SELECT COUNT(*) as bribery_count
        FROM `{table_id}`
        WHERE assigned_officer = @officer_name AND category = 'Corruption'
    """
    bribery_result = list(client.query(corruption_query, job_config=job_config).result())
    bribery_count = bribery_result[0]["bribery_count"] if bribery_result else 0

    risk_score = min((bribery_count / max(total_complaints, 1)) * 100, 100)
    grade = "Poor" if risk_score > 30 else ("Average" if risk_score > 10 else "Good")

    officer_row = {
        "officer_id": officer_name.replace(" ", "_").lower(),
        "officer_name": officer_name,
        "department": department,
        "district": district,
        "total_complaints": total_complaints,
        "bribery_count": bribery_count,
        "avg_resolution_days": None,
        "corruption_risk_score": risk_score,
        "performance_grade": grade
    }
    client.insert_rows_json(officers_table, [officer_row])

    if bribery_count >= 2:
        create_fraud_alert(officer_name, department, district, bribery_count)


def create_fraud_alert(officer_name, department, district, evidence_count):
    alert_row = {
        "alert_id": str(uuid.uuid4()),
        "officer_id": officer_name.replace(" ", "_").lower(),
        "officer_name": officer_name,
        "department": department,
        "district": district,
        "alert_type": "Repeated Corruption Complaints",
        "evidence_count": evidence_count,
        "description": f"{officer_name} has {evidence_count} corruption-related complaints",
        "severity": "High" if evidence_count >= 3 else "Medium",
        "created_at": datetime.utcnow().isoformat()
    }
    client.insert_rows_json(alerts_table, [alert_row])


def get_all_grievances():
    query = f"SELECT * FROM `{table_id}` ORDER BY created_at DESC"
    results = client.query(query).result()
    return [dict(row) for row in results]


def get_category_stats():
    query = f"""
        SELECT category, COUNT(*) as count
        FROM `{table_id}`
        GROUP BY category
        ORDER BY count DESC
    """
    results = client.query(query).result()
    return [dict(row) for row in results]


def detect_hotspots():
    query = f"""
        SELECT category, COUNT(*) as complaint_count
        FROM `{table_id}`
        GROUP BY category
        HAVING COUNT(*) >= 2
        ORDER BY complaint_count DESC
    """
    results = client.query(query).result()
    return [dict(row) for row in results]


def detect_smart_hotspots():
    query = f"""
        SELECT category, location, COUNT(*) as complaint_count
        FROM `{table_id}`
        WHERE location != 'Unspecified'
        GROUP BY category, location
        HAVING COUNT(*) >= 2
        ORDER BY complaint_count DESC
    """
    results = client.query(query).result()
    return [dict(row) for row in results]


def get_recent_complaints_summary(limit: int = 50):
    query = f"""
        SELECT text, category, location, status
        FROM `{table_id}`
        ORDER BY created_at DESC
        LIMIT {limit}
    """
    results = client.query(query).result()
    return [dict(row) for row in results]


def get_corruption_alerts():
    officers = list(client.query(f"SELECT * FROM `{officers_table}` ORDER BY corruption_risk_score DESC").result())
    alerts = list(client.query(f"SELECT * FROM `{alerts_table}` ORDER BY created_at DESC").result())
    return {"officers": [dict(r) for r in officers], "alerts": [dict(r) for r in alerts]}


def get_district_stats():
    query = f"""
        SELECT district, COUNT(*) as complaint_count, AVG(priority_score) as avg_priority
        FROM `{table_id}`
        WHERE district IS NOT NULL AND district != ''
        GROUP BY district
        ORDER BY complaint_count DESC
    """
    results = client.query(query).result()
    return [dict(row) for row in results]


def get_systemic_issues():
    query = f"""
        SELECT category, location, district, COUNT(*) as complaint_count
        FROM `{table_id}`
        WHERE location != 'Unspecified'
        GROUP BY category, location, district
        HAVING COUNT(*) >= 2
        ORDER BY complaint_count DESC
    """
    results = client.query(query).result()
    return [dict(row) for row in results]

    
def get_assigned_officer(mentioned_officer, department, district):
    if mentioned_officer and mentioned_officer != "None":
        return mentioned_officer
    base = DEFAULT_OFFICERS.get(department, "General Grievance Cell")
    return f"{base} - {district}" if district else base

