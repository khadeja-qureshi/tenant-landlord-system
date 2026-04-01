from flask import Blueprint, request
from app.db import get_db_connection
from app.utils import success_response, error_response

notification_bp = Blueprint("notifications", __name__)

@notification_bp.route("/<int:user_id>", methods=["GET"])
def get_notifications(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT *
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        return success_response("Notifications fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@notification_bp.route("/", methods=["POST"])
def create_notification():
    data = request.get_json()
    user_id = data.get("user_id")
    message = data.get("message")

    if not user_id or not message:
        return error_response("user_id and message are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (user_id, message))
        conn.commit()
        return success_response("Notification created", status=201)
    finally:
        cursor.close()
        conn.close()


@notification_bp.route("/<int:notification_id>/read", methods=["PUT"])
def mark_notification_read(notification_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM notifications WHERE id = %s", (notification_id,))
        row = cursor.fetchone()
        if not row:
            return error_response("Notification not found", 404)

        cursor.execute("""
            UPDATE notifications
            SET is_read = 1
            WHERE id = %s
        """, (notification_id,))
        conn.commit()
        return success_response("Notification marked as read")
    finally:
        cursor.close()
        conn.close()


@notification_bp.route("/user/<int:user_id>/read-all", methods=["PUT"])
def mark_all_read(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = %s
        """, (user_id,))
        conn.commit()
        return success_response("All notifications marked as read")
    finally:
        cursor.close()
        conn.close()