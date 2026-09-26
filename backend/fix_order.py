import sqlite3
from datetime import datetime, timedelta

conn = sqlite3.connect("shopsphere.db")

now = datetime.utcnow()

# Order 1: make it look like it was placed 1 day ago
order1_time = now - timedelta(days=1)

# Order 2: make it look like it was placed just now
order2_time = now

conn.execute(
    "UPDATE orders SET created_at = ? WHERE id = ?",
    (order1_time.isoformat(), 1)
)

conn.execute(
    "UPDATE orders SET created_at = ? WHERE id = ?",
    (order2_time.isoformat(), 2)
)

conn.commit()

orders = conn.execute(
    "SELECT id, status, created_at FROM orders WHERE id IN (1, 2)"
).fetchall()

print("Orders updated successfully:")

for order in orders:
    print(order)

conn.close()