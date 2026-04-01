from flask import Blueprint, request
from app.db import get_db_connection
from app.utils import success_response, error_response

feedback_bp = Blueprint("feedback", __name__)

@feedback_bp.route("/", methods=["POST"])
def submit_feedback():
    data = request.get_json()

    request_id = data.get("request_id")
    tenant_id = data.get("tenant_id")
    rating = data.get("rating")
    comment = data.get("comment")

    if not request_id or not tenant_id or rating is None:
        return error_response("request_id, tenant_id and rating are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO feedback (request_id, tenant_id, rating, comment)
        VALUES (%s, %s, %s, %s)
    """, (request_id, tenant_id, rating, comment))

    conn.commit()
    conn.close()

    return success_response("Feedback submitted", status=201)