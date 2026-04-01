from flask import Blueprint, request
from werkzeug.security import generate_password_hash, check_password_hash
from app.db import get_db_connection
from app.utils import success_response, error_response

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "tenant")
    phone = data.get("phone")

    if not name or not email or not password:
        return error_response("Name, email and password are required", 400)

    hashed_password = generate_password_hash(password)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return error_response("Email already exists", 409)

        cursor.execute("""
            INSERT INTO users (name, email, password, role, phone)
            VALUES (%s, %s, %s, %s, %s)
        """, (name, email, hashed_password, role, phone))

        conn.commit()
        user_id = cursor.lastrowid
        return success_response("User registered successfully", {"user_id": user_id}, 201)
    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return error_response("Email and password are required", 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return error_response("Invalid email or password", 401)

        if not check_password_hash(user["password"], password):
            return error_response("Invalid email or password", 401)

        return success_response("Login successful", {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        })
    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/mediators", methods=["GET"])
def get_mediators():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, name, email FROM users WHERE role = 'mediator' ORDER BY name ASC")
        return success_response("Mediators fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/users/role/<role>", methods=["GET"])
def get_users_by_role(role):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, name, email, phone, role, is_active, created_at
            FROM users
            WHERE role = %s
            ORDER BY name ASC
        """, (role,))
        return success_response("Users fetched", cursor.fetchall())
    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, name, email, phone, role, is_active, created_at
            FROM users
            WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        if not user:
            return error_response("User not found", 404)
        return success_response("User fetched", user)
    finally:
        cursor.close()
        conn.close()