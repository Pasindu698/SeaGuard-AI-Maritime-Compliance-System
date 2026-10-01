from backend.services.retrieval_service import retrieval_service


print("\n=== SeaGuard AI Retrieval Test ===\n")


# 1. Load all knowledge-base documents
documents = retrieval_service.load_documents()

print(f"Total documents loaded: {len(documents)}")

for document in documents:
    print(
        f"- {document['file_type']} | "
        f"{document['source']}"
    )


# 2. Build chunks
chunks = retrieval_service.build_chunks()

print(
    f"\nTotal chunks created: {len(chunks)}"
)


# 3. Test fire-related retrieval
query = "engine room fire emergency"

print(
    f"\nSearch query: {query}"
)

results = retrieval_service.search(
    query=query,
    limit=5
)

print(
    f"Results found: {len(results)}\n"
)


for number, result in enumerate(
    results,
    start=1
):

    print(
        f"RESULT {number}"
    )

    print(
        f"Source: {result['source']}"
    )

    print(
        f"Type: {result['file_type']}"
    )

    print(
        f"Chunk: {result['chunk_id']}"
    )

    print(
        f"Score: {result['score']}"
    )

    print(
        f"Content: "
        f"{result['content'][:300]}..."
    )

    print("-" * 60)