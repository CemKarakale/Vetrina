
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_type VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_zip_code VARCHAR(20),
    address_country VARCHAR(100),
    preferences TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    INDEX idx_users_email (email),
    INDEX idx_users_role_type (role_type)
);

CREATE TABLE IF NOT EXISTS Customer_Profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    age INT,
    city VARCHAR(100),
    membership_type VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_customer_profiles_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS Stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_stores_owner_id (owner_id)
);

CREATE TABLE IF NOT EXISTS Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    description TEXT,
    FOREIGN KEY (parent_id) REFERENCES Categories(id) ON DELETE SET NULL,
    INDEX idx_categories_parent_id (parent_id)
);

CREATE TABLE IF NOT EXISTS Products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    category_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES Stores(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE,
    INDEX idx_products_store_id (store_id),
    INDEX idx_products_category_id (category_id)
);

CREATE TABLE IF NOT EXISTS Orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    store_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    grand_total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES Stores(id) ON DELETE CASCADE,
    INDEX idx_orders_user_id (user_id),
    INDEX idx_orders_store_id (store_id)
);

CREATE TABLE IF NOT EXISTS Order_Items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    INDEX idx_order_items_order_id (order_id),
    INDEX idx_order_items_product_id (product_id)
);

CREATE TABLE IF NOT EXISTS Shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    warehouse VARCHAR(255),
    mode VARCHAR(100),
    status VARCHAR(100),
    tracking_number VARCHAR(100),
    estimated_delivery_date DATE,
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_shipments_order_id (order_id)
);

CREATE TABLE IF NOT EXISTS Reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    star_rating INT NOT NULL,
    content TEXT,
    admin_reply TEXT,
    reply_created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    INDEX idx_reviews_user_id (user_id),
    INDEX idx_reviews_product_id (product_id)
);

CREATE TABLE IF NOT EXISTS Store_Settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    email VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    currency VARCHAR(10),
    timezone VARCHAR(50),
    FOREIGN KEY (store_id) REFERENCES Stores(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_store_settings_store_id (store_id)
);

CREATE TABLE IF NOT EXISTS SystemSettings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value VARCHAR(500) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS AuditLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    severity VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    metadata TEXT,
    INDEX idx_audit_logs_actor (actor),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_created_at (created_at)
);

INSERT INTO Users (id, name, email, password_hash, role_type, status) VALUES
(1, 'Admin User', 'admin@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'ADMIN', 'ACTIVE'),
(2, 'Corporate User', 'corp@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'CORPORATE', 'ACTIVE'),
(3, 'User One', 'user1@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'INDIVIDUAL', 'ACTIVE'),
(4, 'User Two', 'user2@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'INDIVIDUAL', 'ACTIVE'),
(5, 'Cory Watson', 'corp5@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'CORPORATE', 'ACTIVE'),
(6, 'Austin Patterson', 'corp6@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'CORPORATE', 'ACTIVE'),
(7, 'Kenneth Harrington', 'corp7@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'CORPORATE', 'ACTIVE'),
(8, 'Robert Macdonald', 'corp8@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'CORPORATE', 'ACTIVE'),
(9, 'Casey Vang', 'corp9@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'CORPORATE', 'ACTIVE'),
(10, 'Teresa Meza', 'samantha00@example.net', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4c0J9bE3cUq6rWq.', 'INDIVIDUAL', 'ACTIVE');