from flask import Blueprint, request
from app.db import get_db_connection
from app.utils import success_response, error_response

dispute_bp = Blueprint("disputes", __name__)


# =========================================================
# GET ALL DISPUTES (ADMIN)
# =========================================================
@dispute_bp.route("/", methods=["GET"])
def get_all_disputes():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                d.id AS dispute_id,
                d.request_id,
                d.initiated_by,
                d.mediator_id,
                d.description,
                d.status,
                d.resolution,
                d.created_at,
                d.resolved_at,
                mr.title AS request_title,
                tenant.name AS initiated_by_name,
                tenant.email AS initiated_by_email,
                mediator.name AS mediator_name
            FROM disputes d
            JOIN maintenance_requests mr ON d.request_id = mr.id
            JOIN users tenant ON d.initiated_by = tenant.id
            LEFT JOIN users mediator ON d.mediator_id = mediator.id
            ORDER BY d.created_at DESC
        """)
        return success_response("Disputes fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


# =========================================================
# GET DISPUTES BY USER (TENANT)
# =========================================================
@dispute_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_disputes(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                d.id AS dispute_id,
                d.request_id,
                d.initiated_by,
                d.mediator_id,
                d.description,
                d.status,
                d.resolution,
                d.created_at,
                d.resolved_at,
                mr.title AS request_title,
                mediator.name AS mediator_name
            FROM disputes d
            JOIN maintenance_requests mr ON d.request_id = mr.id
            LEFT JOIN users mediator ON d.mediator_id = mediator.id
            WHERE d.initiated_by = %s
            ORDER BY d.created_at DESC
        """, (user_id,))
        return success_response("User disputes fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


# =========================================================
# GET DISPUTES FOR LANDLORD'S PROPERTIES
# =========================================================
@dispute_bp.route("/landlord/<int:landlord_id>", methods=["GET"])
def get_landlord_disputes(landlord_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                d.id AS dispute_id,
                d.request_id,
                d.initiated_by,
                d.mediator_id,
                d.description,
                d.status,
                d.resolution,
                d.created_at,
                d.resolved_at,
                mr.title AS request_title,
                tenant.name AS initiated_by_name,
                tenant.email AS initiated_by_email,
                mediator.name AS mediator_name
            FROM disputes d
            JOIN maintenance_requests mr ON d.request_id = mr.id
            JOIN properties p ON mr.property_id = p.id
            JOIN users tenant ON d.initiated_by = tenant.id
            LEFT JOIN users mediator ON d.mediator_id = mediator.id
            WHERE p.landlord_id = %s
            ORDER BY d.created_at DESC
        """, (landlord_id,))
        return success_response("Landlord disputes fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


# =========================================================
# GET DISPUTES ASSIGNED TO MEDIATOR
# =========================================================
@dispute_bp.route("/mediator/<int:mediator_id>", methods=["GET"])
def get_mediator_disputes(mediator_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                d.id AS dispute_id,
                d.request_id,
                d.initiated_by,
                d.mediator_id,
                d.description,
                d.status,
                d.resolution,
                d.created_at,
                d.resolved_at,
                mr.title AS request_title,
                tenant.name AS initiated_by_name
            FROM disputes d
            JOIN maintenance_requests mr ON d.request_id = mr.id
            JOIN users tenant ON d.initiated_by = tenant.id
            WHERE d.mediator_id = %s
            ORDER BY d.created_at DESC
        """, (mediator_id,))
        return success_response("Mediator disputes fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


# =========================================================
# FILE A DISPUTE (TENANT)
# =========================================================
@dispute_bp.route("/", methods=["POST"])
def create_dispute():
    data         = request.get_json()
    request_id   = data.get("request_id")
    initiated_by = data.get("initiated_by")
    description  = data.get("description")

    if not request_id or not initiated_by or not description:
        return error_response("request_id, initiated_by and description are required", 400)

    conn   = get_db_connection()
    cursor = conn.cursor()
    try:
        # Validate maintenance request exists
        cursor.execute("""
            SELECT id, tenant_id, property_id
            FROM maintenance_requests
            WHERE id = %s
        """, (request_id,))
        req = cursor.fetchone()
        if not req:
            return error_response("Maintenance request not found", 404)

        # Create dispute
        cursor.execute("""
            INSERT INTO disputes (request_id, initiated_by, description, status)
            VALUES (%s, %s, %s, 'open')
        """, (request_id, initiated_by, description))
        dispute_id = cursor.lastrowid

        # Notify landlord
        cursor.execute("""
            SELECT landlord_id FROM properties WHERE id = %s
        """, (req["property_id"],))
        prop = cursor.fetchone()
        if prop:
            cursor.execute("""
                INSERT INTO notifications (user_id, message, is_read)
                VALUES (%s, %s, 0)
            """, (
                prop["landlord_id"],
                f"A new dispute has been filed for request #{request_id}."
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
                f"New dispute #{dispute_id} filed for request #{request_id}. Please assign a mediator."
            ))

        conn.commit()
        return success_response("Dispute filed successfully", {"dispute_id": dispute_id}, 201)
    finally:
        cursor.close()
        conn.close()


# =========================================================
# ASSIGN MEDIATOR TO DISPUTE (ADMIN)
# =========================================================
@dispute_bp.route("/<int:dispute_id>/assign-mediator", methods=["PUT"])
def assign_mediator(dispute_id):
    data        = request.get_json()
    mediator_id = data.get("mediator_id")

    if not mediator_id:
        return error_response("mediator_id is required", 400)

    conn   = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, initiated_by FROM disputes WHERE id = %s", (dispute_id,))
        dispute = cursor.fetchone()
        if not dispute:
            return error_response("Dispute not found", 404)

        # Validate mediator role
        cursor.execute("""
            SELECT id, name FROM users WHERE id = %s AND role = 'mediator'
        """, (mediator_id,))
        mediator = cursor.fetchone()
        if not mediator:
            return error_response("Mediator not found", 404)

        # Assign mediator and update status
        cursor.execute("""
            UPDATE disputes
            SET mediator_id = %s, status = 'under_review'
            WHERE id = %s
        """, (mediator_id, dispute_id))

        # Notify mediator
        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            mediator_id,
            f"You have been assigned to dispute #{dispute_id}."
        ))

        # Notify tenant who filed the dispute
        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            dispute["initiated_by"],
            f"Mediator '{mediator['name']}' has been assigned to your dispute #{dispute_id}."
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
                f"Mediator '{mediator['name']}' assigned to dispute #{dispute_id}."
            ))

        conn.commit()
        return success_response("Mediator assigned successfully")
    finally:
        cursor.close()
        conn.close()


# =========================================================
# RESOLVE DISPUTE (MEDIATOR)
# =========================================================
@dispute_bp.route("/<int:dispute_id>/resolve", methods=["PUT"])
def resolve_dispute(dispute_id):
    data       = request.get_json()
    resolution = data.get("resolution")

    if not resolution:
        return error_response("resolution is required", 400)

    conn   = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, initiated_by FROM disputes WHERE id = %s
        """, (dispute_id,))
        dispute = cursor.fetchone()
        if not dispute:
            return error_response("Dispute not found", 404)

        # Resolve the dispute
        cursor.execute("""
            UPDATE disputes
            SET resolution  = %s,
                status      = 'resolved',
                resolved_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (resolution, dispute_id))

        # Notify tenant
        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            dispute["initiated_by"],
            f"Your dispute #{dispute_id} has been resolved."
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
                f"Dispute #{dispute_id} has been resolved by the mediator."
            ))

        conn.commit()
        return success_response("Dispute resolved successfully")
    finally:
        cursor.close()
        conn.close()
