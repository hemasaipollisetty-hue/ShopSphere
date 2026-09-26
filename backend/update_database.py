import sqlite3


DATABASE = "shopsphere.db"


connection = sqlite3.connect(DATABASE)

cursor = connection.cursor()


try:
    cursor.execute(
        "ALTER TABLE products ADD COLUMN image_url TEXT"
    )

    connection.commit()

    print("✅ image_url column added successfully!")


except sqlite3.OperationalError as error:

    if "duplicate column name" in str(error).lower():

        print("✅ image_url column already exists!")

    else:

        print("❌ Database update failed:")
        print(error)


finally:

    connection.close()