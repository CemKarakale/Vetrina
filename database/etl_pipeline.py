import pandas as pd
import random
from faker import Faker
import os

fake = Faker('en_US')

# BCRYPT hash for '123456' - standard $2a$ format widely accepted by Spring Security
PASSWORD_HASH_123456 = "$2a$10$mBGBs0P248qV/W5rB92bNukK.I9A5gJt4q3f.N34w9S0f242m1RGi" 
# Alternative: $2b$12$cvRw.GLYsY/1D2BzBIp4getarB8HlFz6My/ZIZqhFqdDAPDywEMx. (generated natively earlier)
# To ensure maximum spring boot compatibility, we will use the one generated earlier (Spring Boot BCryptPasswordEncoder supports $2a, $2b).
PASSWORD_HASH_123456 = "$2b$12$cvRw.GLYsY/1D2BzBIp4getarB8HlFz6My/ZIZqhFqdDAPDywEMx."

MAX_PRODUCTS = 200
MAX_ORDERS = 500
MAX_REVIEWS = 1000

def escape_str(s):
    if pd.isna(s): return "''"
    # Ensure it's string, replace backslashes and single quotes
    s = str(s).replace('\\', '\\\\').replace("'", "''")
    return f"'{s}'"

def generate_db_script():
    sql_lines = []
    
    def append_sql(line):
        sql_lines.append(line)
        
    # --- 1. SCHEMAS ---
    append_sql("""
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Customer_Profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    age INT,
    city VARCHAR(100),
    membership_type VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INT,
    FOREIGN KEY (parent_id) REFERENCES Categories(id) ON DELETE SET NULL
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
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    store_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    grand_total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES Stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Order_Items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    warehouse VARCHAR(255),
    mode VARCHAR(100),
    status VARCHAR(100),
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    star_rating INT NOT NULL,
    content TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);
""")

    # --- 2. USERS (Strict Hardcoded First 4) ---
    append_sql("-- INSERT USERS")
    users = []
    # 1 Admin
    users.append((1, 'Admin User', 'admin@test.com', PASSWORD_HASH_123456, 'ADMIN'))
    # 1 Corporate
    users.append((2, 'Corporate User', 'corp@test.com', PASSWORD_HASH_123456, 'CORPORATE'))
    # 2 Individuals
    users.append((3, 'User One', 'user1@test.com', PASSWORD_HASH_123456, 'INDIVIDUAL'))
    users.append((4, 'User Two', 'user2@test.com', PASSWORD_HASH_123456, 'INDIVIDUAL'))

    # Let's generate up to 50 total users to support other data
    for i in range(5, 10):
        users.append((i, fake.name(), f'corp{i}@test.com', PASSWORD_HASH_123456, 'CORPORATE'))
    for i in range(10, 51):
        users.append((i, fake.name(), fake.unique.email(), PASSWORD_HASH_123456, 'INDIVIDUAL'))

    for u in users:
        append_sql(f"INSERT INTO Users (id, name, email, password_hash, role_type) VALUES ({u[0]}, {escape_str(u[1])}, '{u[2]}', '{u[3]}', '{u[4]}');")

    # --- 3. CUSTOMER PROFILES (From E-commerce Customer Behavior) ---
    append_sql("-- INSERT CUSTOMER PROFILES")
    try:
        df_cust = pd.read_csv("Dataset/E-commerce Customer Behavior - Sheet1.csv")
    except:
        df_cust = pd.DataFrame()

    m_types = ['Bronze', 'Silver', 'Gold']
    for i, u in enumerate(users[2:]): # Individual users start at index 2
        age = random.randint(18, 65)
        city = fake.city()
        membership = random.choice(m_types)
        
        # Try to pull from dataset if available
        if i < len(df_cust):
            row = df_cust.iloc[i]
            if not pd.isna(row.get('Age')): age = int(row['Age'])
            if not pd.isna(row.get('City')): city = str(row['City'])
            if not pd.isna(row.get('Membership Type')): membership = str(row['Membership Type'])
            
        append_sql(f"INSERT INTO Customer_Profiles (id, user_id, age, city, membership_type) VALUES ({i+1}, {u[0]}, {age}, {escape_str(city)}, {escape_str(membership)});")

    # --- 4. STORES ---
    append_sql("-- INSERT STORES")
    # Corporate users: ID 2, and 5-9
    corp_ids = [2] + list(range(5, 10))
    for i, cid in enumerate(corp_ids):
        append_sql(f"INSERT INTO Stores (id, owner_id, name, status) VALUES ({i+1}, {cid}, {escape_str(fake.company() + ' Store')}, 'OPEN');")
    num_stores = len(corp_ids)

    # --- 5. CATEGORIES & PRODUCTS (From Amazon CSV & TSVs) ---
    append_sql("-- INSERT CATEGORIES & PRODUCTS")
    try:
        df_prod = pd.read_csv("Dataset/amazon.csv")
        df_prod = df_prod.sample(n=MAX_PRODUCTS, random_state=42).reset_index(drop=True)
    except Exception as e:
        print(f"Error reading amazon.csv: {e}")
        df_prod = pd.DataFrame()

    categories = {}
    cat_id_counter = 1
    products_db = []
    
    def clean_price(x):
        try:
            val = str(x).replace('₹', '').replace(',', '').strip()
            return float(val)
        except:
            return random.uniform(10.0, 100.0)

    prod_id_counter = 1
    for idx, row in df_prod.iterrows():
        if prod_id_counter > MAX_PRODUCTS: break
        
        cat_str = str(row.get('category', 'General'))
        main_cat = cat_str.split('|')[0] if pd.notna(cat_str) else 'General'
        
        if main_cat not in categories:
            categories[main_cat] = cat_id_counter
            append_sql(f"INSERT INTO Categories (id, name, parent_id) VALUES ({cat_id_counter}, {escape_str(main_cat)}, NULL);")
            cat_id_counter += 1
            
        c_id = categories[main_cat]
        
        # Determine price
        price = clean_price(row.get('discounted_price', 0))
        if price <= 0: price = clean_price(row.get('actual_price', 0))
        if price <= 0: price = random.uniform(10, 500)
        
        p_name = str(row.get('product_name', f'Amazon Product {prod_id_counter}'))[:490]
        p_desc = str(row.get('about_product', fake.sentence()))[:500]
        
        st_id = random.randint(1, num_stores)
        sku = f'SKU-{fake.ean(length=8)}-{prod_id_counter}'
        stock = random.randint(10, 500)
        
        append_sql(f"INSERT INTO Products (id, store_id, category_id, sku, name, description, unit_price, stock_quantity) VALUES ({prod_id_counter}, {st_id}, {c_id}, '{sku}', {escape_str(p_name)}, {escape_str(p_desc)}, {price:.2f}, {stock});")
        products_db.append({'id': prod_id_counter, 'store_id': st_id, 'price': price, 'stock': stock})
        prod_id_counter += 1

    # --- 6. ORDERS, ITEMS & SHIPMENTS (From Pakistan Data + Train.csv) ---
    append_sql("-- INSERT ORDERS, ITEMS & SHIPMENTS")
    try:
        df_orders = pd.read_csv("Dataset/Pakistan Largest Ecommerce Dataset.csv", low_memory=False)
        df_orders = df_orders.dropna(subset=['increment_id']).sample(n=MAX_ORDERS, random_state=42).reset_index(drop=True)
    except Exception as e:
        print(f"Error reading Pakistan Data: {e}")
        df_orders = pd.DataFrame()

    try:
        df_train = pd.read_csv("Dataset/Train.csv")
    except:
        df_train = pd.DataFrame()

    o_id = 1
    oi_id = 1
    s_id = 1
    
    # Individuals user pool
    indiv_users = [3, 4] + list(range(10, 51))
    
    if len(df_orders) > 0 and len(products_db) > 0:
        for idx, row in df_orders.iterrows():
            if o_id > MAX_ORDERS: break
            
            u_id = random.choice(indiv_users)
            prod = random.choice(products_db)
            st_id = prod['store_id']
            
            status_val = str(row.get('status', 'complete'))
            status = 'COMPLETED' if status_val.lower() == 'complete' else 'PENDING'
            if status_val.lower() in ['canceled', 'cancelled']: status = 'CANCELLED'
            
            try:
                date_str = pd.to_datetime(row.get('created_at')).strftime('%Y-%m-%d %H:%M:%S')
            except:
                date_str = fake.date_time_between(start_date='-1y', end_date='now').strftime('%Y-%m-%d %H:%M:%S')
                
            qty = 1
            try:
                qty = int(row.get('qty_ordered', 1))
            except: pass
            if qty <= 0: qty = 1
            
            total = qty * prod['price']
            
            append_sql(f"INSERT INTO Orders (id, user_id, store_id, status, created_at, grand_total) VALUES ({o_id}, {u_id}, {st_id}, '{status}', '{date_str}', {total:.2f});")
            append_sql(f"INSERT INTO Order_Items (id, order_id, product_id, quantity, price) VALUES ({oi_id}, {o_id}, {prod['id']}, {qty}, {prod['price']:.2f});")
            oi_id += 1
            
            # Create a Shipment
            if status == 'COMPLETED':
                wh = "Main Warehouse"
                mode = "Flight"
                if len(df_train) > o_id:
                    wh = str(df_train.iloc[o_id].get('Warehouse_block', 'A')) + " Block"
                    mode = str(df_train.iloc[o_id].get('Mode_of_Shipment', 'Flight'))
                append_sql(f"INSERT INTO Shipments (id, order_id, warehouse, mode, status) VALUES ({s_id}, {o_id}, {escape_str(wh)}, {escape_str(mode)}, 'DELIVERED');")
                s_id += 1
                
            o_id += 1
    
    # --- 7. REVIEWS (From TSVs & Amazon data limits) ---
    append_sql("-- INSERT REVIEWS")
    base_path = "Dataset/"
    tsv_dirs = [
        "amazon_reviews_multilingual_US_v1_00.tsv",
        "amazon_reviews_us_Furniture_v1_00.tsv",
        "amazon_reviews_us_Gift_Card_v1_00.tsv",
        "amazon_reviews_us_Major_Appliances_v1_00.tsv"
    ]
    
    review_lines = []
    rev_id = 1
    
    # Extract some reviews from TSVs
    for t_dir in tsv_dirs:
        if rev_id > MAX_REVIEWS: break
        dir_path = os.path.join(base_path, t_dir)
        if os.path.isdir(dir_path):
            for f in os.listdir(dir_path):
                if f.endswith('.tsv') and rev_id <= MAX_REVIEWS:
                    try:
                        df_tsv = pd.read_csv(os.path.join(dir_path, f), sep='\t', on_bad_lines='skip', nrows=250)
                        for _, row in df_tsv.iterrows():
                            if rev_id > MAX_REVIEWS: break
                            if pd.notna(row.get('review_body')):
                                star = row.get('star_rating', 5)
                                if pd.isna(star): star = 5
                                try: star = int(star)
                                except: star = 5
                                body = str(row['review_body'])[:1000]
                                review_lines.append((star, body))
                                rev_id += 1
                    except Exception as e:
                        print(f"Skipping TSV {f} due to error: {e}")
                        
    # If TSVs don't load enough properly, supplement with synthetic/amazon data
    if len(review_lines) < MAX_REVIEWS:
        good_reviews = ["Excellent quality", "Great value", "Loved it", "Perfect for my needs", "Best purchase"]
        for i in range(MAX_REVIEWS - len(review_lines)):
            review_lines.append((5, random.choice(good_reviews)))

    # Distribute reviews across the 200 products randomly
    r_id = 1
    for i in range(MAX_REVIEWS):
        if len(products_db) == 0: break
        star, content = review_lines[i]
        u_id = random.choice(indiv_users)
        p_id = random.choice(products_db)['id']
        append_sql(f"INSERT INTO Reviews (id, user_id, product_id, star_rating, content) VALUES ({r_id}, {u_id}, {p_id}, {star}, {escape_str(content)});")
        r_id += 1

    # Shift all order dates by 8 years to make them current
    append_sql("UPDATE Orders SET created_at = DATE_ADD(created_at, INTERVAL 8 YEAR);")

    # Write to File
    with open('init_db.sql', 'w', encoding='utf-8') as f:
        f.write("\\n".join(sql_lines))
        f.write("\\n")
        
    print(f"ETL Complete! init_db.sql generated with:\\n- {len(users)} Users\\n- {len(products_db)} Products (Limit {MAX_PRODUCTS})\\n- {o_id-1} Orders (Limit {MAX_ORDERS})\\n- {r_id-1} Reviews (Limit {MAX_REVIEWS})")

if __name__ == '__main__':
    generate_db_script()
