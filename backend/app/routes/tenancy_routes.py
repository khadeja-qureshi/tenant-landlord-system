from flask import Blueprint, request
from app.db import get_db_connection
from app.utils import success_response, error_response

tenancy_bp = Blueprint("tenancy", __name__)


@tenancy_bp.route("/unassigned-tenants", methods=["GET"])
def get_unassigned_tenants():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT u.id, u.name, u.email, u.phone
            FROM users u
            WHERE u.role = 'tenant'
              AND u.id NOT IN (
                  SELECT tenant_id FROM tenancy WHERE end_date IS NULL
              )
            ORDER BY u.name ASC
        """)
        return success_response("Unassigned tenants fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@tenancy_bp.route("/landlord/<int:landlord_id>", methods=["GET"])
def get_landlord_tenancies(landlord_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                t.id AS tenancy_id,
                u.id AS tenant_id,
                u.name AS tenant_name,
                u.email AS tenant_email,
                u.phone AS tenant_phone,
                p.id AS property_id,
                p.address AS property_address,
                p.description AS property_description,
                t.start_date,
                t.end_date,
                t.monthly_rent
            FROM tenancy t
            JOIN users u ON t.tenant_id = u.id
            JOIN properties p ON t.property_id = p.id
            WHERE p.landlord_id = %s
            ORDER BY t.id DESC
        """, (landlord_id,))
        return success_response("Tenancies fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@tenancy_bp.route("/properties/<int:landlord_id>", methods=["GET"])
def get_landlord_properties(landlord_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, address, description
            FROM properties
            WHERE landlord_id = %s
            ORDER BY id DESC
        """, (landlord_id,))
        return success_response("Properties fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@tenancy_bp.route("/tenant/<int:tenant_id>/my-property", methods=["GET"])
def get_my_property(tenant_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                t.id AS tenancy_id,
                t.start_date,
                t.end_date,
                t.monthly_rent,
                p.id AS property_id,
                p.address,
                p.description,
                p.landlord_id,
                u.name AS landlord_name,
                u.email AS landlord_email,
                u.phone AS landlord_phone
            FROM tenancy t
            JOIN properties p ON t.property_id = p.id
            JOIN users u ON p.landlord_id = u.id
            WHERE t.tenant_id = %s AND t.end_date IS NULL
            ORDER BY t.id DESC
            LIMIT 1
        """, (tenant_id,))
        row = cursor.fetchone()
        if not row:
            return error_response("No active property assigned", 404)
        return success_response("Tenant property fetched", row)
    finally:
        cursor.close()
        conn.close()


@tenancy_bp.route("/assign", methods=["POST"])
def assign_tenant():
    data = request.get_json()
    tenant_id = data.get("tenant_id")
    property_id = data.get("property_id")

    if not tenant_id or not property_id:
        return error_response("tenant_id and property_id are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id FROM users WHERE id = %s AND role = 'tenant'",
            (tenant_id,)
        )
        if not cursor.fetchone():
            return error_response("Tenant not found", 404)

        cursor.execute(
            "SELECT id, landlord_id, address FROM properties WHERE id = %s",
            (property_id,)
        )
        property_row = cursor.fetchone()
        if not property_row:
            return error_response("Property not found", 404)

        cursor.execute("""
            SELECT id
            FROM tenancy
            WHERE tenant_id = %s AND end_date IS NULL
        """, (tenant_id,))
        if cursor.fetchone():
            return error_response("Tenant already has an active tenancy", 409)

        cursor.execute("""
            INSERT INTO tenancy (tenant_id, property_id, start_date)
            VALUES (%s, %s, CURDATE())
        """, (tenant_id, property_id))
        tenancy_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            tenant_id,
            f"You have been assigned to property: {property_row['address']}."
        ))

        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            property_row["landlord_id"],
            f"A tenant has been assigned to your property: {property_row['address']}."
        ))

        conn.commit()
        return success_response(
            "Tenant assigned to property",
            {"tenancy_id": tenancy_id},
            201
        )
    finally:
        cursor.close()
        conn.close()


@tenancy_bp.route("/<int:tenancy_id>/end", methods=["PUT"])
def end_tenancy(tenancy_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM tenancy WHERE id = %s", (tenancy_id,))
        if not cursor.fetchone():
            return error_response("Tenancy not found", 404)

        cursor.execute("""
            UPDATE tenancy
            SET end_date = CURDATE()
            WHERE id = %s
        """, (tenancy_id,))

        conn.commit()
        return success_response("Tenancy ended")
    finally:
        cursor.close()
        conn.close()