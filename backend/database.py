import motor.motor_asyncio
import os

# Database Configuration
# Default to local MongoDB but allow override via environment variable
MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "finan_db"

class Database:
    client: motor.motor_asyncio.AsyncIOMotorClient = None
    db: motor.motor_asyncio.AsyncIOMotorDatabase = None

db = Database()

async def connect_to_mongo():
    db.client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db.db = db.client[DATABASE_NAME]
    print(f"Connected to MongoDB at {MONGODB_URL}")

async def close_mongo_connection():
    db.client.close()
    print("MongoDB connection closed")

def get_db():
    return db.db
