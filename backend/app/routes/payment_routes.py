from flask import Blueprint, request
from app.db import get_db_connection
from app.utils import success_response, error_response

payment_bp = Blueprint("payments", __name__)

@payment_bp.route("/tenant/<int:tenant_id>", methods=["GET"])
def get_tenant_payments(tenant_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                p.*,
                pr.address AS property_address
            FROM payments p
            JOIN properties pr ON p.property_id = pr.id
            WHERE p.tenant_id = %s
            ORDER BY p.payment_year DESC,
                     FIELD(p.payment_month, 'January','February','March','April','May','June','July','August','September','October','November','December') DESC,
                     p.id DESC
        """, (tenant_id,))
        return success_response("Tenant payments fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@payment_bp.route("/landlord/<int:landlord_id>", methods=["GET"])
def get_landlord_payments(landlord_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                p.*,
                u.name AS tenant_name,
                u.email AS tenant_email,
                pr.address AS property_address
            FROM payments p
            JOIN users u ON p.tenant_id = u.id
            JOIN properties pr ON p.property_id = pr.id
            WHERE pr.landlord_id = %s
            ORDER BY p.payment_year DESC,
                     FIELD(p.payment_month, 'January','February','March','April','May','June','July','August','September','October','November','December') DESC,
                     p.id DESC
        """, (landlord_id,))
        return success_response("Landlord payments fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@payment_bp.route("/tenancy/<int:tenancy_id>", methods=["GET"])
def get_tenancy_payments(tenancy_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT *
            FROM payments
            WHERE tenancy_id = %s
            ORDER BY payment_year DESC,
                     FIELD(payment_month, 'January','February','March','April','May','June','July','August','September','October','November','December') DESC,
                     id DESC
        """, (tenancy_id,))
        return success_response("Tenancy payments fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@payment_bp.route("/setup-tenancy-rent", methods=["PUT"])
def setup_tenancy_rent():
    data = request.get_json()
    tenancy_id = data.get("tenancy_id")
    monthly_rent = data.get("monthly_rent")

    if not tenancy_id or monthly_rent is None:
        return error_response("tenancy_id and monthly_rent are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM tenancy WHERE id = %s", (tenancy_id,))
        tenancy = cursor.fetchone()
        if not tenancy:
            return error_response("Tenancy not found", 404)

        cursor.execute("""
            UPDATE tenancy
            SET monthly_rent = %s
            WHERE id = %s
        """, (monthly_rent, tenancy_id))

        conn.commit()
        return success_response("Monthly rent updated successfully")
    finally:
        cursor.close()
        conn.close()


@payment_bp.route("/generate", methods=["POST"])
def generate_payment_record():
    data = request.get_json()
    tenancy_id = data.get("tenancy_id")
    payment_month = data.get("payment_month")
    payment_year = data.get("payment_year")
    due_date = data.get("due_date")

    if not tenancy_id or not payment_month or not payment_year or not due_date:
        return error_response("tenancy_id, payment_month, payment_year, and due_date are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                t.id,
                t.tenant_id,
                t.property_id,
                t.monthly_rent,
                p.landlord_id,
                p.address
            FROM tenancy t
            JOIN properties p ON t.property_id = p.id
            WHERE t.id = %s
        """, (tenancy_id,))
        tenancy = cursor.fetchone()

        if not tenancy:
            return error_response("Tenancy not found", 404)

        if tenancy["monthly_rent"] is None:
            return error_response("Set monthly rent first for this tenancy", 400)

        cursor.execute("""
            SELECT id FROM payments
            WHERE tenancy_id = %s
              AND payment_month = %s
              AND payment_year = %s
        """, (tenancy_id, payment_month, payment_year))
        existing = cursor.fetchone()

        if existing:
            return error_response("Payment record already exists for this month", 409)

        cursor.execute("""
            INSERT INTO payments
            (tenancy_id, tenant_id, property_id, amount_due, amount_paid, payment_month, payment_year, due_date, status)
            VALUES (%s, %s, %s, %s, 0.00, %s, %s, %s, 'pending')
        """, (
            tenancy_id,
            tenancy["tenant_id"],
            tenancy["property_id"],
            tenancy["monthly_rent"],
            payment_month,
            payment_year,
            due_date
        ))
        payment_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            tenancy["tenant_id"],
            f"Rent payment record created for {payment_month} {payment_year}. Due date: {due_date}."
        ))

        conn.commit()
        return success_response("Payment record generated", {"payment_id": payment_id}, 201)
    finally:
        cursor.close()
        conn.close()


@payment_bp.route("/record", methods=["POST"])
def record_payment():
    data = request.get_json()
    payment_id = data.get("payment_id")
    amount_paid = data.get("amount_paid")
    payment_method = data.get("payment_method")
    reference_note = data.get("reference_note")
    paid_date = data.get("paid_date")

    if not payment_id or amount_paid is None:
        return error_response("payment_id and amount_paid are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                p.*,
                pr.landlord_id
            FROM payments p
            JOIN properties pr ON p.property_id = pr.id
            WHERE p.id = %s
        """, (payment_id,))
        payment = cursor.fetchone()

        if not payment:
            return error_response("Payment record not found", 404)

        new_total_paid = float(payment["amount_paid"]) + float(amount_paid)
        amount_due = float(payment["amount_due"])

        if new_total_paid <= 0:
            status = "pending"
        elif new_total_paid < amount_due:
            status = "partial"
        else:
            status = "paid"

        cursor.execute("""
            UPDATE payments
            SET amount_paid = %s,
                payment_method = %s,
                reference_note = %s,
                paid_date = %s,
                status = %s
            WHERE id = %s
        """, (
            new_total_paid,
            payment_method,
            reference_note,
            paid_date,
            status,
            payment_id
        ))

        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            payment["landlord_id"],
            f"Tenant recorded a payment for {payment['payment_month']} {payment['payment_year']}."
        ))

        conn.commit()
        return success_response("Payment recorded successfully")
    finally:
        cursor.close()
        conn.close()


@payment_bp.route("/<int:payment_id>/status", methods=["PUT"])
def update_payment_status(payment_id):
    data = request.get_json()
    status = data.get("status")

    if not status:
        return error_response("status is required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, tenant_id
            FROM payments
            WHERE id = %s
        """, (payment_id,))
        payment = cursor.fetchone()

        if not payment:
            return error_response("Payment record not found", 404)

        cursor.execute("""
            UPDATE payments
            SET status = %s
            WHERE id = %s
        """, (status, payment_id))

        cursor.execute("""
            INSERT INTO notifications (user_id, message, is_read)
            VALUES (%s, %s, 0)
        """, (
            payment["tenant_id"],
            f"Your rent payment status was updated to '{status}'."
        ))

        conn.commit()
        return success_response("Payment status updated successfully")
    finally:
        cursor.close()
        conn.close()


@payment_bp.route("/mark-late", methods=["PUT"])
def mark_late_payments():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE payments
            SET status = 'late'
            WHERE status IN ('pending', 'partial')
              AND due_date < CURDATE()
        """)
        conn.commit()
        return success_response("Late payments updated")
    finally:
        cursor.close()
        conn.close()