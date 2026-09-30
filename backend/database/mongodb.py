import os

from dotenv import load_dotenv
from pymongo import MongoClient


load_dotenv()


MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "seaguard_ai")


client = None
db = None


if MONGODB_URL:
    client = MongoClient(
        MONGODB_URL,
        serverSelectionTimeoutMS=5000
    )

    db = client[DATABASE_NAME]


def check_database_connection():
    try:
        if client is None:
            return False

        client.admin.command("ping")
        return True

    except Exception as error:
        print("MongoDB connection error:", error)
        return False