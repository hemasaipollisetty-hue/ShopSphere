import sqlite3

conn = sqlite3.connect("shopsphere.db")

columns = [
    ("delivery_name", "TEXT"),
    ("delivery_phone", "TEXT"),
    ("delivery_address", "TEXT"),
    ("delivery_city", "TEXT"),
    ("delivery_state", "TEXT"),
    ("delivery_pincode", "TEXT"),
]

for column_name, column_type in columns:
    try:
        conn.execute(
            f"ALTER TABLE orders ADD COLUMN {column_name} {column_type}"
        )
        print(f"Added column: {column_name}")
    except sqlite3.OperationalError as error:
        if "duplicate column name" in str(error).lower():
            print(f"Column already exists: {column_name}")
        else:
            raise

conn.commit()
conn.close()

print("\nOrder address columns updated successfully!")