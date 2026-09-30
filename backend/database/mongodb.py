import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "seaguard_ai")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL is missing in .env file")

client = MongoClient(MONGODB_URL)
database = client[DATABASE_NAME]

def check_database_connection():
    try:
        client.admin.command("ping")
        return True
    except Exception as error:
        print("MongoDB connection error:", error)
        return False