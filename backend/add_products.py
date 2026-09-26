from app.database import SessionLocal
from app.models.product import Product

db = SessionLocal()

products = [
    {
        "name": "Wireless Bluetooth Headphones",
        "description": "Comfortable wireless headphones with clear sound and long battery life.",
        "price": 799,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
    },
    {
        "name": "Wireless Mouse",
        "description": "Smooth and comfortable wireless mouse for laptop and desktop.",
        "price": 299,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1527814050087-3793815479db"
    },
    {
        "name": "Mechanical Keyboard",
        "description": "Compact mechanical keyboard for work, study and gaming.",
        "price": 899,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3"
    },
    {
        "name": "Smart Watch",
        "description": "Stylish smartwatch with fitness tracking and notifications.",
        "price": 999,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
    },
    {
        "name": "Bluetooth Speaker",
        "description": "Portable Bluetooth speaker with powerful and clear audio.",
        "price": 599,
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1"
    },
    {
        "name": "Cotton T-Shirt",
        "description": "Soft and comfortable everyday cotton T-shirt.",
        "price": 299,
        "category": "Fashion",
        "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
    },
    {
        "name": "Casual Sneakers",
        "description": "Comfortable casual sneakers for everyday use.",
        "price": 899,
        "category": "Fashion",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
    },
    {
        "name": "Women's Handbag",
        "description": "Stylish and spacious handbag for daily use.",
        "price": 699,
        "category": "Fashion",
        "image_url": "https://images.unsplash.com/photo-1584917865442-de89df76afd3"
    },
    {
        "name": "Classic Sunglasses",
        "description": "Trendy sunglasses suitable for everyday outdoor use.",
        "price": 299,
        "category": "Accessories",
        "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083"
    },
    {
        "name": "Leather Wallet",
        "description": "Compact wallet with multiple card and cash slots.",
        "price": 249,
        "category": "Accessories",
        "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93"
    },
    {
        "name": "Travel Backpack",
        "description": "Lightweight backpack for college, office and travel.",
        "price": 699,
        "category": "Accessories",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    },
    {
        "name": "Face Wash",
        "description": "Gentle daily face wash for clean and fresh skin.",
        "price": 199,
        "category": "Beauty",
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03"
    },
    {
        "name": "Moisturizer",
        "description": "Lightweight moisturizer for everyday skincare.",
        "price": 249,
        "category": "Beauty",
        "image_url": "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd"
    },
    {
        "name": "Sunscreen",
        "description": "Daily sunscreen for protection from harmful UV rays.",
        "price": 299,
        "category": "Beauty",
        "image_url": "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8"
    },
    {
        "name": "Water Bottle",
        "description": "Reusable water bottle for home, college and travel.",
        "price": 199,
        "category": "Home",
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8"
    },
    {
        "name": "Table Lamp",
        "description": "Simple modern table lamp for study and bedroom use.",
        "price": 499,
        "category": "Home",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c"
    },
    {
        "name": "Coffee Mug",
        "description": "Simple ceramic coffee mug for home and office.",
        "price": 149,
        "category": "Home",
        "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d"
    },
    {
        "name": "Oats",
        "description": "Healthy oats suitable for breakfast and snacks.",
        "price": 149,
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1517093602195-b40af9688b46"
    },
    {
        "name": "Coffee",
        "description": "Rich and aromatic coffee for your daily cup.",
        "price": 249,
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"
    },
    {
        "name": "Dry Fruits",
        "description": "Nutritious mixed dry fruits for everyday snacking.",
        "price": 399,
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1599599810694-b5ac7b9f2b6a"
    }
]

for item in products:
    product = db.query(Product).filter(Product.name == item["name"]).first()

    if product:
        product.price = item["price"]
        product.image_url = item["image_url"]
        product.description = item["description"]
        product.category = item["category"]
        print(f"✅ Updated: {item['name']}")
    else:
        product = Product(**item)
        db.add(product)
        print(f"✅ Added: {item['name']}")

db.commit()
db.close()

print("\n🎉 Product images and prices updated successfully!")