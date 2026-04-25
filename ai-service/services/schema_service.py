DB_SCHEMA = """
Veritabanı Tabloları ve Sütunları:

users
  - id (INT, PK)
  - email (VARCHAR)
  - password_hash (VARCHAR)
  - role_type (VARCHAR)
  - created_at (DATETIME)

customer_profiles
  - id (INT, PK)
  - user_id (INT, FK -> users.id)
  - first_name (VARCHAR)
  - last_name (VARCHAR)
  - phone (VARCHAR)

stores
  - id (INT, PK)
  - owner_id (INT, FK -> users.id)
  - name (VARCHAR)
  - status (VARCHAR)

products
  - id (INT, PK)
  - store_id (INT, FK -> stores.id)
  - name (VARCHAR)
  - category_id (INT, FK -> categories.id)
  - unit_price (DECIMAL)
  - stock_quantity (INT)

categories
  - id (INT, PK)
  - parent_id (INT, FK -> categories.id, NULL for root)
  - name (VARCHAR)

orders
  - id (INT, PK)
  - user_id (INT, FK -> users.id)
  - store_id (INT, FK -> stores.id)
  - status (VARCHAR) - PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
  - grand_total (DECIMAL)
  - created_at (DATETIME)

order_items
  - id (INT, PK)
  - order_id (INT, FK -> orders.id)
  - product_id (INT, FK -> products.id)
  - quantity (INT)
  - price (DECIMAL) -- NOT unit_price!

shipments
  - id (INT, PK)
  - order_id (INT, FK -> orders.id, UNIQUE)
  - tracking_number (VARCHAR)
  - status (VARCHAR)
  - carrier (VARCHAR)

reviews
  - id (INT, PK)
  - user_id (INT, FK -> users.id)
  - product_id (INT, FK -> products.id)
  - star_rating (INT, 1-5)
  - content (TEXT)
  - created_at (DATETIME)
"""

def get_schema() -> str:
    return DB_SCHEMA
