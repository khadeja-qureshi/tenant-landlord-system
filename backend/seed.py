from app.db import get_db_connection
from werkzeug.security import generate_password_hash

conn   = get_db_connection()
cursor = conn.cursor()

print("Connected to:", end=" ")
cursor.execute("SELECT DATABASE()")
print(cursor.fetchone())

# ── Clear all tables ───────────────────────────────
cursor.execute("DELETE FROM activity_logs")
cursor.execute("DELETE FROM notifications")
cursor.execute("DELETE FROM feedback")
cursor.execute("DELETE FROM evidence")
cursor.execute("DELETE FROM request_assignments")
cursor.execute("DELETE FROM disputes")
cursor.execute("DELETE FROM maintenance_requests")
cursor.execute("DELETE FROM tenancy")
cursor.execute("DELETE FROM properties")
cursor.execute("DELETE FROM service_providers")
cursor.execute("DELETE FROM users")

# Reset auto increment so IDs start from 1
cursor.execute("ALTER TABLE users             AUTO_INCREMENT = 1")
cursor.execute("ALTER TABLE properties        AUTO_INCREMENT = 1")
cursor.execute("ALTER TABLE tenancy           AUTO_INCREMENT = 1")
cursor.execute("ALTER TABLE service_providers AUTO_INCREMENT = 1")

# ── Users ──────────────────────────────────────────
# id 1 = landlord, id 2-6 = tenants, id 7 = mediator, id 8 = admin
users = [
    ("Ahmed Khan",   "ahmed@test.com",   "landlord"),   # id 1
    ("Sara Ali",     "sara@test.com",    "tenant"),     # id 2
    ("Amna Sheikh",  "amna@test.com",    "tenant"),     # id 3
    ("Bilal Raza",   "bilal@test.com",   "tenant"),     # id 4
    ("Hira Baig",    "hira@test.com",    "tenant"),     # id 5
    ("Usman Tariq",  "usman@test.com",   "tenant"),     # id 6
    ("Zain Malik",   "zain@test.com",    "mediator"),   # id 7
    ("Admin User",   "admin@test.com",   "admin"),      # id 8
]
for name, email, role in users:
    cursor.execute("""
        INSERT INTO users (name, email, password, role, phone)
        VALUES (%s, %s, %s, %s, %s)
    """, (name, email, generate_password_hash("password123"), role, "0300-0000000"))

print("✅ Users inserted (1 landlord, 5 tenants, 1 mediator, 1 admin)")

# ── Properties (all owned by Ahmed = landlord id 1) ─
properties = [
    (1, "DHA Phase 5, Karachi",       "2-bedroom apartment"),
    (1, "Gulshan-e-Iqbal, Karachi",   "3-bedroom flat"),
    (1, "Clifton Block 4, Karachi",   "Studio apartment"),
    (1, "North Nazimabad, Karachi",   "1-bedroom apartment"),
    (1, "Bahria Town, Karachi",       "4-bedroom house"),
]
for landlord_id, address, description in properties:
    cursor.execute("""
        INSERT INTO properties (landlord_id, address, description)
        VALUES (%s, %s, %s)
    """, (landlord_id, address, description))

print("✅ Properties inserted (5 properties for Ahmed)")

# ── Tenancy (each tenant assigned to a different property) ──
# tenant_id, property_id
tenancies = [
    (2, 1),   # Sara      → DHA Phase 5
    (3, 2),   # Amna      → Gulshan-e-Iqbal
    (4, 3),   # Bilal     → Clifton
    (5, 4),   # Hira      → North Nazimabad
    (6, 5),   # Usman     → Bahria Town
]
for tenant_id, property_id in tenancies:
    cursor.execute("""
        INSERT INTO tenancy (tenant_id, property_id, start_date)
        VALUES (%s, %s, CURDATE())
    """, (tenant_id, property_id))

print("✅ Tenancies inserted (each tenant assigned to a property)")

# ── Service Providers ──────────────────────────────
providers = [
    ("Ali Plumbing Services",  "0300-1234567", "Plumbing"),
    ("Karachi Electricals",    "0311-9876543", "Electrical"),
    ("Ahmed Carpentry",        "0333-5556666", "Carpentry"),
    ("All Shine Cleaning",     "0333-1236666", "Cleaning"),
    ("FastFix HVAC",           "0321-9998888", "AC Repair"),
    ("PaintPro Karachi",       "0312-7776655", "Painting"),
]
for name, contact, service in providers:
    cursor.execute("""
        INSERT INTO service_providers (name, contact_info, service_type)
        VALUES (%s, %s, %s)
    """, (name, contact, service))

print("✅ Service providers inserted (6 providers)")

conn.commit()
cursor.close()
conn.close()

print("\n🎉 Database seeded successfully!")
print("\nLogin credentials (all passwords: password123)")
print("─" * 45)
print("  Landlord : ahmed@test.com")
print("  Tenant 1 : sara@test.com   → DHA Phase 5")
print("  Tenant 2 : amna@test.com   → Gulshan-e-Iqbal")
print("  Tenant 3 : bilal@test.com  → Clifton Block 4")
print("  Tenant 4 : hira@test.com   → North Nazimabad")
print("  Tenant 5 : usman@test.com  → Bahria Town")
print("  Mediator : zain@test.com")
print("  Admin    : admin@test.com")