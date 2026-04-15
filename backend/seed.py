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
cursor.execute("DELETE FROM payments")
cursor.execute("DELETE FROM tenancy")
cursor.execute("DELETE FROM properties")
cursor.execute("DELETE FROM service_providers")
cursor.execute("DELETE FROM users")

# Reset auto increment so IDs start from 1
cursor.execute("ALTER TABLE users             AUTO_INCREMENT = 1")
cursor.execute("ALTER TABLE properties        AUTO_INCREMENT = 1")
cursor.execute("ALTER TABLE tenancy           AUTO_INCREMENT = 1")
cursor.execute("ALTER TABLE service_providers AUTO_INCREMENT = 1")
cursor.execute("ALTER TABLE payments          AUTO_INCREMENT = 1")

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
# tenant_id, property_id, monthly_rent
tenancies = [
    (2, 1, 45000.00),   # Sara      → DHA Phase 5
    (3, 2, 55000.00),   # Amna      → Gulshan-e-Iqbal
    (4, 3, 35000.00),   # Bilal     → Clifton
    (5, 4, 30000.00),   # Hira      → North Nazimabad
    (6, 5, 80000.00),   # Usman     → Bahria Town
]
for tenant_id, property_id, monthly_rent in tenancies:
    cursor.execute("""
        INSERT INTO tenancy (tenant_id, property_id, start_date, monthly_rent)
        VALUES (%s, %s, CURDATE(), %s)
    """, (tenant_id, property_id, monthly_rent))

print("✅ Tenancies inserted (each tenant assigned to a property)")

# ── Payments ───────────────────────────────────────
# tenancy_id, tenant_id, property_id, amount_due, amount_paid, payment_month,
# payment_year, due_date, paid_date, payment_method, reference_note, status
payments = [
    (1, 2, 1, 45000.00, 45000.00, "January",  2026, "2026-01-05", "2026-01-04", "Bank Transfer", "Paid on time", "paid"),
    (1, 2, 1, 45000.00, 45000.00, "February", 2026, "2026-02-05", "2026-02-05", "JazzCash",      "Monthly rent paid", "paid"),
    (1, 2, 1, 45000.00,     0.00, "March",    2026, "2026-03-05", None,         None,            "Awaiting payment", "pending"),

    (2, 3, 2, 55000.00, 55000.00, "January",  2026, "2026-01-05", "2026-01-03", "Cash",          "Paid early", "paid"),
    (2, 3, 2, 55000.00, 30000.00, "February", 2026, "2026-02-05", "2026-02-06", "Bank Transfer", "Partially paid", "partial"),
    (2, 3, 2, 55000.00,     0.00, "March",    2026, "2026-03-05", None,         None,            "Not paid yet", "pending"),

    (3, 4, 3, 35000.00, 35000.00, "January",  2026, "2026-01-05", "2026-01-05", "EasyPaisa",     "Paid", "paid"),
    (3, 4, 3, 35000.00, 35000.00, "February", 2026, "2026-02-05", "2026-02-04", "Bank Transfer", "Paid", "paid"),
    (3, 4, 3, 35000.00, 35000.00, "March",    2026, "2026-03-05", "2026-03-02", "Cash",          "Paid", "paid"),

    (4, 5, 4, 30000.00, 30000.00, "January",  2026, "2026-01-05", "2026-01-07", "Cash",          "Paid late", "paid"),
    (4, 5, 4, 30000.00,     0.00, "February", 2026, "2026-02-05", None,         None,            "Overdue", "pending"),
    (4, 5, 4, 30000.00,     0.00, "March",    2026, "2026-03-05", None,         None,            "Pending payment", "pending"),

    (5, 6, 5, 80000.00, 80000.00, "January",  2026, "2026-01-05", "2026-01-05", "Bank Transfer", "Paid", "paid"),
    (5, 6, 5, 80000.00, 80000.00, "February", 2026, "2026-02-05", "2026-02-05", "Bank Transfer", "Paid", "paid"),
    (5, 6, 5, 80000.00, 40000.00, "March",    2026, "2026-03-05", "2026-03-06", "JazzCash",      "Half payment received", "partial"),
]
for tenancy_id, tenant_id, property_id, amount_due, amount_paid, payment_month, payment_year, due_date, paid_date, payment_method, reference_note, status in payments:
    cursor.execute("""
        INSERT INTO payments (
            tenancy_id, tenant_id, property_id, amount_due, amount_paid,
            payment_month, payment_year, due_date, paid_date,
            payment_method, reference_note, status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        tenancy_id, tenant_id, property_id, amount_due, amount_paid,
        payment_month, payment_year, due_date, paid_date,
        payment_method, reference_note, status
    ))

print("✅ Payments inserted (15 payment records)")

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