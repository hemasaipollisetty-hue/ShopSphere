import sqlite3

DATABASE = "shopsphere.db"

connection = sqlite3.connect(DATABASE)
cursor = connection.cursor()

try:
    cursor.execute(
        "ALTER TABLE users ADD COLUMN password VARCHAR"
    )

    connection.commit()

    print("✅ Password column added successfully!")

except sqlite3.OperationalError as error:
    if "duplicate column name" in str(error).lower():
        print("ℹ️ Password column already exists.")
    else:
        print("❌ Database error:", error)

finally:
    connection.close()