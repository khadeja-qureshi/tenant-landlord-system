
-- ============================================================
-- Tenant–Landlord Maintenance & Dispute Resolution Platform
-- FINAL DATABASE (INT USER IDs)
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE TABLE properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    landlord_id INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (landlord_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================
-- TENANCY
-- ============================================================

CREATE TABLE tenancy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    property_id INT NOT NULL,
    start_date DATE,
    end_date DATE,

    FOREIGN KEY (tenant_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
);
select * from tenancy;
-- ============================================================
-- MAINTENANCE REQUESTS
-- ============================================================

CREATE TABLE maintenance_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    property_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(50),
    priority VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
);

-- ============================================================
-- SERVICE PROVIDERS
-- ============================================================

CREATE TABLE service_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_info VARCHAR(255),
    service_type VARCHAR(100)
);

-- ============================================================
-- REQUEST ASSIGNMENTS
-- ============================================================

CREATE TABLE request_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    provider_id INT NOT NULL,
    assigned_by INT NOT NULL,
    status VARCHAR(20) DEFAULT 'assigned',
    notes VARCHAR(255),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (request_id)
        REFERENCES maintenance_requests(id)
        ON DELETE CASCADE,

    FOREIGN KEY (provider_id)
        REFERENCES service_providers(id)
        ON DELETE CASCADE,

    FOREIGN KEY (assigned_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================
-- DISPUTES
-- ============================================================

CREATE TABLE disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    initiated_by INT NOT NULL,
    mediator_id INT,
    description VARCHAR(500),
    status VARCHAR(20) DEFAULT 'open',
    resolution VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,

    FOREIGN KEY (request_id)
        REFERENCES maintenance_requests(id)
        ON DELETE CASCADE,

    FOREIGN KEY (initiated_by)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (mediator_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================
-- EVIDENCE
-- ============================================================

CREATE TABLE evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uploaded_by INT NOT NULL,
    request_id INT NULL,
    dispute_id INT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    original_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (request_id)
        REFERENCES maintenance_requests(id)
        ON DELETE CASCADE,

    FOREIGN KEY (dispute_id)
        REFERENCES disputes(id)
        ON DELETE CASCADE
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255),
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================
-- FEEDBACK
-- ============================================================

CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    tenant_id INT NOT NULL,
    rating INT,
    comment VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (request_id)
        REFERENCES maintenance_requests(id)
        ON DELETE CASCADE,

    FOREIGN KEY (tenant_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================

CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    entity_type VARCHAR(50),
    entity_id INT,
    action VARCHAR(100),
    details VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

select *from users;
INSERT INTO tenancy (tenant_id, property_id, start_date)
VALUES (1, 1, CURDATE());
select *from users;
select *from properties;
INSERT INTO properties (landlord_id, address, description)
VALUES (1, 'DHA Karachi', 'Apartment');

INSERT INTO tenancy (tenant_id, property_id, start_date)
VALUES (1, 1, CURDATE());
select *from maintenance_requests;

SELECT id, tenant_id, property_id, status
FROM maintenance_requests;

SELECT id, name, role FROM users;
UPDATE properties
SET landlord_id = 2
WHERE id = 1;

INSERT INTO properties (landlord_id, address, description)
VALUES (2, 'DHA Karachi', 'Apartment');
select * from users;
DESCRIBE disputes;
INSERT INTO properties (landlord_id, address, description)
VALUES (1, 'DHA phase 5, Karachi', 'Apartment 2');
select * from properties;
use rental_system;

ALTER TABLE evidence
ADD COLUMN tenancy_id INT NULL,
ADD COLUMN document_category VARCHAR(50) NULL;

ALTER TABLE evidence
ADD CONSTRAINT fk_evidence_tenancy
FOREIGN KEY (tenancy_id) REFERENCES tenancy(id)
ON DELETE CASCADE;


CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenancy_id INT NOT NULL,
    tenant_id INT NOT NULL,
    property_id INT NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_month VARCHAR(20) NOT NULL,
    payment_year INT NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    payment_method VARCHAR(50) NULL,
    reference_note VARCHAR(255) NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenancy_id) REFERENCES tenancy(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

ALTER TABLE tenancy
ADD COLUMN monthly_rent DECIMAL(10,2) NULL;


select * from users;
use rental_system;