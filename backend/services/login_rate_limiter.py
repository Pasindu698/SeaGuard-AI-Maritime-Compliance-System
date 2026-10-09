
from datetime import datetime, timedelta, timezone

from backend.database.mongodb import db


MAX_ATTEMPTS = 5
WINDOW_MINUTES = 15


class LoginRateLimiter:

    def _collection(self):
        if db is None:
            raise RuntimeError("Database connection is unavailable.")

        return db.login_attempts

    def check_limit(self, username: str):
        username = username.strip().lower()
        collection = self._collection()

        record = collection.find_one({"username": username})

        if not record:
            return

        now = datetime.now(timezone.utc)

        first_attempt = record.get("first_attempt")

        if first_attempt is None:
            collection.delete_one({"username": username})
            return

        # MongoDB/PyMongo may return naive UTC datetimes.
        if first_attempt.tzinfo is None:
            first_attempt = first_attempt.replace(tzinfo=timezone.utc)

        if now >= first_attempt + timedelta(minutes=WINDOW_MINUTES):
            collection.delete_one({"username": username})
            return

        if record.get("attempts", 0) >= MAX_ATTEMPTS:
            raise ValueError(
                "Too many failed login attempts. "
                "Please try again after 15 minutes."
            )

    def record_failure(self, username: str):
        username = username.strip().lower()
        collection = self._collection()
        now = datetime.now(timezone.utc)

        record = collection.find_one({"username": username})

        if record:
            first_attempt = record.get("first_attempt")

            if first_attempt is not None:
                if first_attempt.tzinfo is None:
                    first_attempt = first_attempt.replace(
                        tzinfo=timezone.utc
                    )

                if now < first_attempt + timedelta(minutes=WINDOW_MINUTES):
                    collection.update_one(
                        {"username": username},
                        {"$inc": {"attempts": 1}}
                    )
                    return

        collection.update_one(
            {"username": username},
            {
                "$set": {
                    "attempts": 1,
                    "first_attempt": now
                }
            },
            upsert=True
        )

    def reset_attempts(self, username: str):
        username = username.strip().lower()

        self._collection().delete_one({
            "username": username
        })


login_rate_limiter = LoginRateLimiter()
