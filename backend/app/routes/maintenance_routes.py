from flask import Blueprint, request
from app.db import get_db_connection
from app.utils import success_response, error_response

maintenance_bp = Blueprint("maintenance", __name__)


# =========================================================
# GET ALL REQUESTS (LANDLORD / ADMIN)
# =========================================================
@maintenance_bp.route("/", methods=["GET"])
def get_maintenance_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                mr.*,
                u.name  AS tenant_name,
                u.email AS tenant_email,
                u.phone AS tenant_phone,
                p.address     AS property_address,
                p.landlord_id AS landlord_id
            FROM maintenance_requests mr
            LEFT JOIN users      u ON mr.tenant_id   = u.id
            LEFT JOIN properties p ON mr.property_id = p.id
            ORDER BY mr.created_at DESC
        """)
        return success_response("Maintenance requests fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


# =========================================================
# GET SINGLE REQUEST
# =========================================================
@maintenance_bp.route("/<int:request_id>", methods=["GET"])
def get_maintenance_request(request_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                mr.*,
                u.name  AS tenant_name,
                u.email AS tenant_email,
                u.phone AS tenant_phone,
                p.address     AS property_address,
                p.landlord_id AS landlord_id
            FROM maintenance_requests mr
            LEFT JOIN users      u ON mr.tenant_id   = u.id
            LEFT JOIN properties p ON mr.property_id = p.id
            WHERE mr.id = %s
        """, (request_id,))
        maintenance_request = cursor.fetchone()

        if not maintenance_request:
            return error_response("Maintenance request not found", 404)

        return success_response("Maintenance request fetched", maintenance_request)
    finally:
        cursor.close()
        conn.close()


# =========================================================
# GET REQUESTS BY TENANT
# =========================================================
@maintenance_bp.route("/tenant/<int:tenant_id>", methods=["GET"])
def get_tenant_requests(tenant_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                mr.*,
                p.address     AS property_address,
                p.landlord_id AS landlord_id
            FROM maintenance_requests mr
            LEFT JOIN properties p ON mr.property_id = p.id
            WHERE mr.tenant_id = %s
            ORDER BY mr.created_at DESC
        """, (tenant_id,))
        return success_response("Tenant requests fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


# =========================================================
# CREATE MAINTENANCE REQUEST (TENANT)
# =========================================================
@maintenance_bp.route("/", methods=["POST"])
def create_maintenance_request():
    data        = request.get_json()
    tenant_id   = data.get("tenant_id")
    title       = data.get("title")
    description = data.get("description")
    category    = data.get("category")
    priority    = data.get("priority", "medium")

    if not tenant_id or not title or not description:
        return error_response("tenant_id, title and description are required", 400)

    conn   = get_db_connection()
    cursor = conn.cursor()
    try:
        # Find active tenancy
        cursor.execute("""
            SELECT t.property_id, p.landlord_id, p.address
            FROM tenancy t
            JOIN properties p ON t.property_id = p.id
            WHERE t.tenant_id = %s
              AND t.end_date IS NULL
            LIMIT 1
        """, (tenant_id,))
        tenancy = cursor.fetchone()

        if not tenancy:
            return error_response("Tenant is not assigned to any active property", 400)

        property_id = tenancy["property_id"]

        # Insert maintenance request
        cursor.execute("""
            INSERT INTO maintenance_requests
                (tenant_id, property_id, title, description, category, priority, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
        """, (tenant_id, property_id, title, description, category, priority))
        request_id = cursor.lastrowid

        # Activity log
        cursor.execute("""
            INSERT INTO activity_logs
                (user_id, entity_type, entity_id, action, details)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            tenant_id,
            "maintenance_request",
            request_id,
            "created",
            f"Created request: {title}"
        ))

        # Notify landlord
        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            tenancy["landlord_id"],
            f"New maintenance request #{request_id} submitted for property '{tenancy['address']}'."
        ))

        # ✅ Notify all admins
        cursor.execute("SELECT id FROM users WHERE role = 'admin'")
        admins = cursor.fetchall()
        for admin in admins:
            cursor.execute("""
                INSERT INTO notifications (user_id, message, is_read)
                VALUES (%s, %s, 0)
            """, (
                admin["id"],
                f"New maintenance request #{request_id}: '{title}' submitted by tenant."
            ))

        conn.commit()
        return success_response(
            "Maintenance request created",
            {"request_id": request_id},
            201
        )
    finally:
        cursor.close()
        conn.close()


# =========================================================
# UPDATE REQUEST STATUS (LANDLORD)
# =========================================================
@maintenance_bp.route("/<int:request_id>/status", methods=["PUT"])
def update_maintenance_status(request_id):
    data    = request.get_json()
    status  = data.get("status")
    user_id = data.get("user_id")

    allowed_statuses = {"pending", "in_progress", "completed", "resolved", "disputed"}

    if not status or not user_id:
        return error_response("status and user_id are required", 400)

    if status not in allowed_statuses:
        return error_response("Invalid status", 400)

    conn   = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, tenant_id, title, status
            FROM maintenance_requests
            WHERE id = %s
        """, (request_id,))
        existing = cursor.fetchone()

        if not existing:
            return error_response("Maintenance request not found", 404)

        # Update status
        cursor.execute("""
            UPDATE maintenance_requests
            SET status     = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (status, request_id))

        # Activity log
        cursor.execute("""
            INSERT INTO activity_logs
                (user_id, entity_type, entity_id, action, details)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_id,
            "maintenance_request",
            request_id,
            "status_updated",
            f"Changed status from {existing['status']} to {status}"
        ))

        # Notify tenant
        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            existing["tenant_id"],
            f"Your maintenance request #{request_id} ('{existing['title']}') status changed to '{status}'."
        ))

        # ✅ Notify all admins when status changes to key statuses
        if status in {"completed", "resolved", "disputed"}:
            cursor.execute("SELECT id FROM users WHERE role = 'admin'")
            admins = cursor.fetchall()
            for admin in admins:
                cursor.execute("""
                    INSERT INTO notifications (user_id, message, is_read)
                    VALUES (%s, %s, 0)
                """, (
                    admin["id"],
                    f"Maintenance request #{request_id} ('{existing['title']}') marked as '{status}'."
                ))

        conn.commit()
        return success_response("Maintenance status updated")
    finally:
        cursor.close()
        conn.close()


# =========================================================
# TENANT DECISION — APPROVE OR REJECT COMPLETED WORK
# =========================================================
@maintenance_bp.route("/<int:request_id>/tenant-decision", methods=["PUT"])
def tenant_decision(request_id):
    data     = request.get_json()
    user_id  = data.get("user_id")
    decision = data.get("decision")  # approve / reject

    if not user_id or not decision:
        return error_response("user_id and decision are required", 400)

    if decision not in {"approve", "reject"}:
        return error_response("decision must be approve or reject", 400)

    conn   = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                mr.id,
                mr.tenant_id,
                mr.status,
                mr.title,
                mr.property_id,
                p.landlord_id
            FROM maintenance_requests mr
            JOIN properties p ON mr.property_id = p.id
            WHERE mr.id = %s
        """, (request_id,))
        req = cursor.fetchone()

        if not req:
            return error_response("Maintenance request not found", 404)

        if int(req["tenant_id"]) != int(user_id):
            return error_response("Only the tenant who created this request can decide", 403)

        if req["status"] != "completed":
            return error_response("Tenant decision is only allowed when status is completed", 400)

        new_status = "resolved" if decision == "approve" else "disputed"

        # Update status
        cursor.execute("""
            UPDATE maintenance_requests
            SET status     = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (new_status, request_id))

        # Activity log
        cursor.execute("""
            INSERT INTO activity_logs
                (user_id, entity_type, entity_id, action, details)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_id,
            "maintenance_request",
            request_id,
            "tenant_decision",
            f"Tenant chose to {decision} completed work"
        ))

        # Notify landlord
        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            req["landlord_id"],
            f"Tenant has {decision}d the completed work for request #{request_id} ('{req['title']}')."
        ))

        # ✅ Notify all admins
        cursor.execute("SELECT id FROM users WHERE role = 'admin'")
        admins = cursor.fetchall()
        for admin in admins:
            cursor.execute("""
                INSERT INTO notifications (user_id, message, is_read)
                VALUES (%s, %s, 0)
            """, (
                admin["id"],
                f"Tenant {decision}d completed work for request #{request_id} ('{req['title']}'). Status: {new_status}."
            ))

        conn.commit()
        return success_response("Tenant decision recorded", {"status": new_status})
    finally:
        cursor.close()
        conn.close()
