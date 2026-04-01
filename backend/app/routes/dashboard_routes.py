from flask import Blueprint
from app.db import get_db_connection
from app.utils import success_response, error_response

dashboard_bp = Blueprint("dashboard", __name__)

# =========================================================
# DASHBOARD SUMMARY (ADMIN OVERVIEW)
# =========================================================
@dashboard_bp.route("/landlord/requests/<int:landlord_id>")
def landlord_requests(landlord_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT
            mr.id,
            mr.title,
            mr.description,
            mr.status,

            p.id AS property_id,
            p.address AS property_address,

            u.name AS tenant_name,
            u.email AS tenant_email

        FROM maintenance_requests mr

        LEFT JOIN properties p
            ON mr.property_id = p.id

        LEFT JOIN users u
            ON mr.tenant_id = u.id

        WHERE p.landlord_id = %s
        ORDER BY mr.id DESC
    """

    cursor.execute(query, (landlord_id,))
    data = cursor.fetchall()

    conn.close()

    return {"data": data}
# =========================================================
# LANDLORD DASHBOARD STATS
# =========================================================
@dashboard_bp.route("/landlord/stats/<int:landlord_id>")
def landlord_stats(landlord_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT
            COUNT(*) AS total_requests,

            SUM(CASE WHEN mr.status='pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN mr.status='in_progress' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN mr.status='resolved' THEN 1 ELSE 0 END) AS resolved

        FROM maintenance_requests mr
        JOIN properties p
            ON mr.property_id = p.id

        WHERE p.landlord_id = %s
    """

    cursor.execute(query, (landlord_id,))
    data = cursor.fetchone()

    conn.close()

    return {"data": data}
