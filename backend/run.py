from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from app.routes.auth_routes import auth_bp
from app.routes.maintenance_routes import maintenance_bp
from app.routes.dispute_routes import dispute_bp
from app.routes.evidence_routes import evidence_bp
from app.routes.notification_routes import notification_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.feedback_routes import feedback_bp
from app.routes.provider_routes import provider_bp
from app.routes.assignment_routes import assignment_bp
from app.routes.tenancy_routes import tenancy_bp
from app.routes.property_routes import property_bp
from app.routes.payment_routes import payment_bp
from app.db import get_db_connection

load_dotenv()

app = Flask(__name__)

CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
    supports_credentials=True,
)

app.config["SECRET_KEY"] = "supersecretkey"
app.config["UPLOAD_FOLDER"] = "uploads"

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(maintenance_bp, url_prefix="/api/maintenance")
app.register_blueprint(dispute_bp, url_prefix="/api/disputes")
app.register_blueprint(evidence_bp, url_prefix="/api/evidence")
app.register_blueprint(notification_bp, url_prefix="/api/notifications")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(feedback_bp, url_prefix="/api/feedback")
app.register_blueprint(provider_bp, url_prefix="/api/providers")
app.register_blueprint(assignment_bp, url_prefix="/api/assignments")
app.register_blueprint(tenancy_bp, url_prefix="/api/tenancy")
app.register_blueprint(property_bp, url_prefix="/api/properties")
app.register_blueprint(payment_bp, url_prefix="/api/payments")

@app.route("/")
def home():
    return {"message": "Backend is running"}

@app.route("/test-db")
def test_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    conn.close()
    return {"message": "DB Connected", "result": result}

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)