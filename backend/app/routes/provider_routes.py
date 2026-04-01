from flask import Blueprint, request
from app.db import get_db_connection
from app.utils import success_response, error_response

provider_bp = Blueprint("providers", __name__)


@provider_bp.route("/", methods=["GET"])
def get_providers():
    service_type = request.args.get("service_type")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if service_type:
            cursor.execute("""
                SELECT id, name, contact_info, service_type
                FROM service_providers
                WHERE service_type = %s
                ORDER BY name ASC
            """, (service_type,))
        else:
            cursor.execute("""
                SELECT id, name, contact_info, service_type
                FROM service_providers
                ORDER BY name ASC
            """)
        return success_response("Service providers fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@provider_bp.route("/", methods=["POST"])
def add_provider():
    data = request.get_json()
    name = data.get("name")
    contact_info = data.get("contact_info")
    service_type = data.get("service_type")

    if not name or not service_type:
        return error_response("name and service_type are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO service_providers (name, contact_info, service_type)
            VALUES (%s, %s, %s)
        """, (name, contact_info, service_type))
        conn.commit()
        return success_response(
            "Service provider added successfully",
            {"provider_id": cursor.lastrowid},
            201
        )
    finally:
        cursor.close()
        conn.close()


@provider_bp.route("/<int:provider_id>", methods=["GET"])
def get_provider(provider_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, name, contact_info, service_type
            FROM service_providers
            WHERE id = %s
        """, (provider_id,))
        provider = cursor.fetchone()
        if not provider:
            return error_response("Service provider not found", 404)
        return success_response("Service provider fetched", provider)
    finally:
        cursor.close()
        conn.close()