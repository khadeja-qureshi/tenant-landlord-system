import os
import uuid
from flask import Blueprint, request, send_from_directory
from werkzeug.utils import secure_filename

from app.db import get_db_connection
from app.utils import success_response, error_response

evidence_bp = Blueprint("evidence", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "doc", "docx", "txt"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@evidence_bp.route("/upload", methods=["POST"])
def upload_evidence():
    if "file" not in request.files:
        return error_response("No file provided", 400)

    file = request.files["file"]
    uploaded_by = request.form.get("uploaded_by")
    request_id = request.form.get("request_id")
    dispute_id = request.form.get("dispute_id")
    tenancy_id = request.form.get("tenancy_id")
    document_category = request.form.get("document_category", "other")

    if not uploaded_by:
        return error_response("uploaded_by is required", 400)

    if file.filename == "":
        return error_response("Empty filename", 400)

    if not allowed_file(file.filename):
        return error_response("Unsupported file type", 400)

    original_name = secure_filename(file.filename)
    ext = original_name.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(save_path)

    file_url = f"/api/evidence/file/{unique_name}"

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO evidence
            (uploaded_by, request_id, dispute_id, tenancy_id, file_url, file_type, original_name, document_category)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            uploaded_by,
            request_id if request_id else None,
            dispute_id if dispute_id else None,
            tenancy_id if tenancy_id else None,
            file_url,
            ext,
            original_name,
            document_category
        ))
        evidence_id = cursor.lastrowid
        conn.commit()

        return success_response(
            "Document uploaded successfully",
            {
                "id": evidence_id,
                "file_url": file_url,
                "original_name": original_name,
                "document_category": document_category,
            },
            201,
        )
    finally:
        cursor.close()
        conn.close()


@evidence_bp.route("/request/<int:request_id>", methods=["GET"])
def get_request_evidence(request_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                e.id,
                e.uploaded_by,
                e.request_id,
                e.dispute_id,
                e.tenancy_id,
                e.file_url,
                e.file_type,
                e.original_name,
                e.document_category,
                e.created_at,
                u.name AS uploaded_by_name
            FROM evidence e
            LEFT JOIN users u ON e.uploaded_by = u.id
            WHERE e.request_id = %s
            ORDER BY e.created_at DESC
        """, (request_id,))
        return success_response("Request evidence fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@evidence_bp.route("/dispute/<int:dispute_id>", methods=["GET"])
def get_dispute_evidence(dispute_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                e.id,
                e.uploaded_by,
                e.request_id,
                e.dispute_id,
                e.tenancy_id,
                e.file_url,
                e.file_type,
                e.original_name,
                e.document_category,
                e.created_at,
                u.name AS uploaded_by_name
            FROM evidence e
            LEFT JOIN users u ON e.uploaded_by = u.id
            WHERE e.dispute_id = %s
            ORDER BY e.created_at DESC
        """, (dispute_id,))
        return success_response("Dispute evidence fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@evidence_bp.route("/tenancy/<int:tenancy_id>", methods=["GET"])
def get_tenancy_evidence(tenancy_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                e.id,
                e.uploaded_by,
                e.request_id,
                e.dispute_id,
                e.tenancy_id,
                e.file_url,
                e.file_type,
                e.original_name,
                e.document_category,
                e.created_at,
                u.name AS uploaded_by_name
            FROM evidence e
            LEFT JOIN users u ON e.uploaded_by = u.id
            WHERE e.tenancy_id = %s
            ORDER BY e.created_at DESC
        """, (tenancy_id,))
        return success_response("Tenancy evidence fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@evidence_bp.route("/tenant-verification/<int:tenant_id>", methods=["GET"])
def get_tenant_verification_docs(tenant_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                e.id,
                e.uploaded_by,
                e.request_id,
                e.dispute_id,
                e.tenancy_id,
                e.file_url,
                e.file_type,
                e.original_name,
                e.document_category,
                e.created_at,
                u.name AS uploaded_by_name
            FROM evidence e
            LEFT JOIN users u ON e.uploaded_by = u.id
            WHERE e.uploaded_by = %s
              AND e.document_category IN (
                'tenant_id_document',
                'tenant_income_document',
                'tenant_employment_document',
                'tenant_verification',
                'other_verification'
              )
            ORDER BY e.created_at DESC
        """, (tenant_id,))
        return success_response("Tenant verification documents fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@evidence_bp.route("/<int:evidence_id>", methods=["PUT"])
def update_document(evidence_id):
    data = request.get_json()
    original_name = data.get("original_name")
    document_category = data.get("document_category")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM evidence WHERE id = %s", (evidence_id,))
        if not cursor.fetchone():
            return error_response("Document not found", 404)

        cursor.execute("""
            UPDATE evidence
            SET original_name = %s,
                document_category = %s
            WHERE id = %s
        """, (original_name, document_category, evidence_id))
        conn.commit()
        return success_response("Document updated successfully")
    finally:
        cursor.close()
        conn.close()


@evidence_bp.route("/<int:evidence_id>", methods=["DELETE"])
def delete_document(evidence_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, file_url FROM evidence WHERE id = %s", (evidence_id,))
        row = cursor.fetchone()
        if not row:
            return error_response("Document not found", 404)

        if row["file_url"]:
            filename = row["file_url"].split("/")[-1]
            path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(path):
                os.remove(path)

        cursor.execute("DELETE FROM evidence WHERE id = %s", (evidence_id,))
        conn.commit()
        return success_response("Document deleted successfully")
    finally:
        cursor.close()
        conn.close()


@evidence_bp.route("/file/<path:filename>", methods=["GET"])
def serve_uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)