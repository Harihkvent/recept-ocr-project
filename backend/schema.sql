-- Users table
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(80) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- Receipts table
CREATE TABLE receipts (
    receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image_uri TEXT NOT NULL,
    ocr_text TEXT,
    merchant_name VARCHAR(120),
    purchase_date DATE,
    currency CHAR(3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Expenses table
CREATE TABLE expenses (
    expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER UNIQUE NOT NULL,
    category_id INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receipt_id) REFERENCES receipts(receipt_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Optional: Line items
CREATE TABLE line_items (
    line_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER NOT NULL,
    description VARCHAR(200),
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2),
    FOREIGN KEY (receipt_id) REFERENCES receipts(receipt_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_receipts_user_date ON receipts(user_id, purchase_date);
CREATE INDEX idx_expenses_category_date ON expenses(category_id, created_at);
CREATE INDEX idx_receipts_merchant ON receipts(merchant_name);
