
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import DESCENDING

from backend.database.mongodb import db


class ChatHistoryService:

    @staticmethod
    def collection():
        if db is None:
            raise RuntimeError(
                "MongoDB connection is not available."
            )
        return db.chat_conversations

    @staticmethod
    def parse_id(conversation_id):
        try:
            return ObjectId(conversation_id)
        except (InvalidId, TypeError):
            raise ValueError("Invalid conversation ID.")

    @staticmethod
    def serialize(conversation):
        return {
            "conversation_id": str(conversation["_id"]),
            "title": conversation["title"],
            "document_id": conversation.get("document_id"),
            "messages": conversation.get("messages", []),
            "created_at": conversation["created_at"],
            "updated_at": conversation["updated_at"],
        }

    def create_conversation(
        self,
        owner_id,
        title="New Chat",
        document_id=None,
    ):
        now = datetime.now(timezone.utc)

        document = {
            "owner_id": str(owner_id),
            "title": title.strip(),
            "document_id": document_id,
            "messages": [],
            "created_at": now,
            "updated_at": now,
        }

        result = self.collection().insert_one(document)

        return self.get_conversation(
            str(result.inserted_id),
            owner_id,
        )

    def list_conversations(self, owner_id):
        cursor = self.collection().find(
            {"owner_id": str(owner_id)},
            {"messages": 0},
        ).sort(
            "updated_at",
            DESCENDING,
        ).limit(100)

        return [
            {
                "conversation_id": str(item["_id"]),
                "title": item["title"],
                "document_id": item.get("document_id"),
                "created_at": item["created_at"],
                "updated_at": item["updated_at"],
            }
            for item in cursor
        ]

    def get_conversation(
        self,
        conversation_id,
        owner_id,
    ):
        document = self.collection().find_one({
            "_id": self.parse_id(conversation_id),
            "owner_id": str(owner_id),
        })

        if document is None:
            raise ValueError(
                "Conversation not found or access denied."
            )

        return self.serialize(document)

    def add_messages(
        self,
        conversation_id,
        owner_id,
        user_message,
        assistant_message,
    ):
        now = datetime.now(timezone.utc)

        result = self.collection().update_one(
            {
                "_id": self.parse_id(conversation_id),
                "owner_id": str(owner_id),
            },
            {
                "$push": {
                    "messages": {
                        "$each": [
                            user_message,
                            assistant_message,
                        ]
                    }
                },
                "$set": {
                    "updated_at": now,
                },
            },
        )

        if result.matched_count == 0:
            raise ValueError(
                "Conversation not found or access denied."
            )

        return self.get_conversation(
            conversation_id,
            owner_id,
        )

    def rename_conversation(
        self,
        conversation_id,
        owner_id,
        title,
    ):
        result = self.collection().update_one(
            {
                "_id": self.parse_id(conversation_id),
                "owner_id": str(owner_id),
            },
            {
                "$set": {
                    "title": title.strip(),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        if result.matched_count == 0:
            raise ValueError(
                "Conversation not found or access denied."
            )

        return self.get_conversation(
            conversation_id,
            owner_id,
        )

    def delete_conversation(
        self,
        conversation_id,
        owner_id,
    ):
        result = self.collection().delete_one({
            "_id": self.parse_id(conversation_id),
            "owner_id": str(owner_id),
        })

        if result.deleted_count == 0:
            raise ValueError(
                "Conversation not found or access denied."
            )

        return {
            "message": "Conversation deleted successfully."
        }


chat_history_service = ChatHistoryService()
