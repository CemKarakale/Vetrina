DB_SCHEMA = """
Veritabanı Tabloları ve Sütunları (GÜNCELLENDI - 2026):

users
  - id (INT, PK)
  - name (VARCHAR)
  - email (VARCHAR)
  - password_hash (VARCHAR) -- HİÇBİR SORGUDA KULLANMA!
  - role_type (VARCHAR) -- ADMIN, CORPORATE, INDIVIDUAL
  - phone (VARCHAR)
  - address_street (VARCHAR)
  - address_city (VARCHAR)
  - address_state (VARCHAR)
  - address_zip_code (VARCHAR)
  - address_country (VARCHAR)
  - status (VARCHAR) -- ACTIVE, INACTIVE, SUSPENDED
  - created_at (DATETIME)
  - last_login_at (DATETIME)

customer_profiles
  - id (INT, PK)
  - user_id (INT, FK -> users.id)
  - age (INT)
  - city (VARCHAR)
  - membership_type (VARCHAR) -- BASIC, SILVER, GOLD, PLATINUM

stores
  - id (INT, PK)
  - owner_id (INT, FK -> users.id)
  - name (VARCHAR)
  - status (VARCHAR) -- ACTIVE, INACTIVE

categories
  - id (INT, PK)
  - name (VARCHAR)
  - parent_id (INT, FK -> categories.id, NULL for root)
  - status (VARCHAR) -- ACTIVE, INACTIVE
  - description (TEXT)

products
  - id (INT, PK)
  - store_id (INT, FK -> stores.id)
  - category_id (INT, FK -> categories.id)
  - sku (VARCHAR) -- UNIQUE
  - name (VARCHAR)
  - description (TEXT)
  - unit_price (DECIMAL)
  - stock_quantity (INT)

orders
  - id (INT, PK)
  - user_id (INT, FK -> users.id)
  - store_id (INT, FK -> stores.id)
  - status (VARCHAR) -- PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, REFUNDED
  - created_at (DATETIME)
  - grand_total (DECIMAL)

order_items
  - id (INT, PK)
  - order_id (INT, FK -> orders.id)
  - product_id (INT, FK -> products.id)
  - quantity (INT)
  - price (DECIMAL) -- order anındaki fiyat

shipments
  - id (INT, PK)
  - order_id (INT, FK -> orders.id, UNIQUE)
  - warehouse (VARCHAR)
  - mode (VARCHAR) -- STANDARD, EXPRESS, OVERNIGHT
  - status (VARCHAR) -- PENDING, PROCESSING, IN_TRANSIT, DELIVERED
  - tracking_number (VARCHAR)
  - estimated_delivery_date (DATE)

reviews
  - id (INT, PK)
  - user_id (INT, FK -> users.id)
  - product_id (INT, FK -> products.id)
  - star_rating (INT, 1-5)
  - content (TEXT)
  - admin_reply (TEXT)
  - reply_created_at (DATETIME)
  - created_at (DATETIME)

store_settings
  - id (INT, PK)
  - store_id (INT, FK -> stores.id, UNIQUE)
  - email (VARCHAR)
  - category (VARCHAR)
  - description (TEXT)
  - currency (VARCHAR)
  - timezone (VARCHAR)

system_settings
  - id (INT, PK)
  - setting_key (VARCHAR, UNIQUE)
  - setting_value (VARCHAR)
  - description (TEXT)

audit_logs
  - id (INT, PK)
  - actor (VARCHAR)
  - action (VARCHAR)
  - entity_type (VARCHAR)
  - entity_id (INT)
  - severity (VARCHAR) -- INFO, WARNING, DANGER
  - created_at (DATETIME)
  - metadata (TEXT)
"""

def get_schema() -> str:
    return DB_SCHEMA
