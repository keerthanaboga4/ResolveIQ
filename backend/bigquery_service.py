from google.cloud import bigquery
import uuid
from datetime import datetime

client = bigquery.Client(project="resolve-iq-503213")
table_id = "resolve-iq-503213.grievance_data.grievances"

def save_grievance(text: str, category: str):
    row = {
        "id": str(uuid.uuid4()),
        "text": text,
        "category": category,
        "status": "Pending",
        "created_at": datetime.utcnow().isoformat()
    }
    errors = client.insert_rows_json(table_id, [row])
    if errors:
        raise Exception(f"BigQuery insert error: {errors}")
    return row
#get-grievances list all complaints#
def get_all_grievances():
    query = f"SELECT * FROM `{table_id}` ORDER BY created_at DESC"
    results = client.query(query).result()
    return [dict(row) for row in results]
#readiness-stats - Dashboard Summary (counts by category/status)#
def get_category_stats():
    query = f"""
        SELECT category, COUNT(*) as count
        FROM `{table_id}`
        GROUP BY category
        ORDER BY count DESC
    """
    results = client.query(query).result()
    return [dict(row) for row in results]
#Anomaly/pattern detection
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