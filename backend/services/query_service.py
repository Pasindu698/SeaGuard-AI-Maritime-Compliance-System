from backend.database.mongodb import db


class QueryService:

    def detect_intent(self, query: str) -> str:

        query_lower = query.lower()

        if any(
            word in query_lower
            for word in [
                "document",
                "certificate",
                "paperwork"
            ]
        ):
            return "document_requirement"

        if any(
            word in query_lower
            for word in [
                "fire",
                "collision",
                "emergency",
                "overboard",
                "medical"
            ]
        ):
            return "emergency_query"

        if any(
            word in query_lower
            for word in [
                "security",
                "unauthorized",
                "suspicious"
            ]
        ):
            return "security_query"

        if any(
            word in query_lower
            for word in [
                "incident",
                "report"
            ]
        ):
            return "incident_query"

        return "general_maritime_query"


    def search_documents(self, query: str):

        if db is None:
            raise RuntimeError(
                "Database connection is not available."
            )

        query_words = [
            word.lower()
            for word in query.split()
            if len(word) > 2
        ]

        documents = list(
            db.documents.find(
                {},
                {
                    "_id": 0,
                    "filename": 1,
                    "summary": 1,
                    "incident_type": 1,
                    "vessel_name": 1,
                    "extracted_text": 1
                }
            ).limit(50)
        )

        matches = []

        for document in documents:

            searchable_text = (
                document.get("extracted_text", "")
                + " "
                + document.get("summary", "")
            ).lower()

            score = sum(
                1
                for word in query_words
                if word in searchable_text
            )

            if score > 0:
                matches.append(
                    (score, document)
                )

        matches.sort(
            key=lambda item: item[0],
            reverse=True
        )

        return [
            document
            for score, document in matches[:5]
        ]


    def answer_query(self, query: str):

        intent = self.detect_intent(query)

        matches = self.search_documents(query)

        if not matches:
            return {
                "query": query,
                "intent": intent,
                "answer": (
                    "No matching information was found "
                    "in the uploaded maritime documents."
                ),
                "sources": []
            }

        best_document = matches[0]

        return {
            "query": query,
            "intent": intent,
            "answer": best_document.get(
                "summary",
                "Matching document found."
            ),
            "sources": [
                document.get(
                    "filename",
                    "Unknown document"
                )
                for document in matches
            ]
        }


query_service = QueryService()