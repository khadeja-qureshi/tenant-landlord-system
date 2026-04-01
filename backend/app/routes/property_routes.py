from flask import Blueprint, request
from app.db import get_db_connection
from app.utils import success_response, error_response

property_bp = Blueprint("properties", __name__)

@property_bp.route("/", methods=["GET"])
def get_properties():
    landlord_id = request.args.get("landlord_id")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if landlord_id:
            cursor.execute("""
                SELECT
                    p.id,
                    p.address,
                    p.description,
                    p.created_at,
                    p.landlord_id,
                    u.name AS landlord_name,
                    u.email AS landlord_email
                FROM properties p
                JOIN users u ON p.landlord_id = u.id
                WHERE p.landlord_id = %s
                ORDER BY p.id DESC
            """, (landlord_id,))
        else:
            cursor.execute("""
                SELECT
                    p.id,
                    p.address,
                    p.description,
                    p.created_at,
                    p.landlord_id,
                    u.name AS landlord_name,
                    u.email AS landlord_email
                FROM properties p
                JOIN users u ON p.landlord_id = u.id
                ORDER BY p.id DESC
            """)
        return success_response("Properties fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@property_bp.route("/", methods=["POST"])
def add_property():
    data = request.get_json()
    landlord_id = data.get("landlord_id")
    address = data.get("address")
    description = data.get("description")

    if not landlord_id or not address:
        return error_response("landlord_id and address are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE id = %s AND role = 'landlord'", (landlord_id,))
        landlord = cursor.fetchone()
        if not landlord:
            return error_response("Valid landlord not found", 404)

        cursor.execute("""
            INSERT INTO properties (landlord_id, address, description)
            VALUES (%s, %s, %s)
        """, (landlord_id, address, description))
        conn.commit()

        property_id = cursor.lastrowid
        return success_response("Property added successfully", {"property_id": property_id}, 201)
    finally:
        cursor.close()
        conn.close()