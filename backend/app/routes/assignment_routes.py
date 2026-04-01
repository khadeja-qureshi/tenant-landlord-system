from flask import Blueprint, request
from app.db import get_db_connection
from app.utils import success_response, error_response

assignment_bp = Blueprint("assignments", __name__)


@assignment_bp.route("/request/<int:request_id>", methods=["GET"])
def get_request_assignments(request_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                ra.id,
                ra.request_id,
                ra.provider_id,
                ra.assigned_by,
                ra.status,
                ra.notes,
                ra.assigned_at,
                sp.name AS provider_name,
                sp.contact_info,
                sp.service_type,
                u.name AS assigned_by_name
            FROM request_assignments ra
            JOIN service_providers sp ON ra.provider_id = sp.id
            JOIN users u ON ra.assigned_by = u.id
            WHERE ra.request_id = %s
            ORDER BY ra.assigned_at DESC
        """, (request_id,))
        return success_response("Request assignments fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@assignment_bp.route("/", methods=["POST"])
def assign_provider_to_request():
    data = request.get_json()
    request_id = data.get("request_id")
    provider_id = data.get("provider_id")
    assigned_by = data.get("assigned_by")
    notes = data.get("notes")

    if not request_id or not provider_id or not assigned_by:
        return error_response("request_id, provider_id and assigned_by are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT mr.id, mr.tenant_id, mr.property_id, mr.title, p.landlord_id
            FROM maintenance_requests mr
            JOIN properties p ON mr.property_id = p.id
            WHERE mr.id = %s
        """, (request_id,))
        req = cursor.fetchone()
        if not req:
            return error_response("Maintenance request not found", 404)

        cursor.execute("""
            SELECT id, name
            FROM service_providers
            WHERE id = %s
        """, (provider_id,))
        provider = cursor.fetchone()
        if not provider:
            return error_response("Service provider not found", 404)

        cursor.execute("""
            INSERT INTO request_assignments
            (request_id, provider_id, assigned_by, status, notes)
            VALUES (%s, %s, %s, 'assigned', %s)
        """, (request_id, provider_id, assigned_by, notes))
        assignment_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            req["tenant_id"],
            f"Service provider '{provider['name']}' has been assigned to your request #{request_id}."
        ))

        conn.commit()
        return success_response(
            "Service provider assigned successfully",
            {"assignment_id": assignment_id},
            201
        )
    finally:
        cursor.close()
        conn.close()


@assignment_bp.route("/<int:assignment_id>/status", methods=["PUT"])
def update_assignment_status(assignment_id):
    data = request.get_json()
    status = data.get("status")
    notes = data.get("notes")

    if not status:
        return error_response("status is required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                ra.id,
                ra.request_id,
                mr.tenant_id
            FROM request_assignments ra
            JOIN maintenance_requests mr ON ra.request_id = mr.id
            WHERE ra.id = %s
        """, (assignment_id,))
        row = cursor.fetchone()
        if not row:
            return error_response("Assignment not found", 404)

        cursor.execute("""
            UPDATE request_assignments
            SET status = %s,
                notes = %s
            WHERE id = %s
        """, (status, notes, assignment_id))

        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            row["tenant_id"],
            f"Your assigned service provider status for request #{row['request_id']} is now '{status}'."
        ))

        conn.commit()
        return success_response("Assignment status updated")
    finally:
        cursor.close()
        conn.close()