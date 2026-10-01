from backend.services.vector_service import vector_service


print("=== SeaGuard AI Vector Database Test ===")

# -----------------------------------------
# 1. Vector Store Information
# -----------------------------------------

print("\n1. Vector Store Information")

info = vector_service.get_vector_store_info()

print("Database:", info["database"])
print("Collection:", info["collection"])
print("Embedding Model:", info["embedding_model"])
print("Stored Chunks:", info["stored_chunks"])


# -----------------------------------------
# 2. Build Vector Store
# -----------------------------------------

print("\n2. Building Vector Store")

build_result = vector_service.build_vector_store(
    rebuild=True
)

print("Status:", build_result["status"])
print(
    "Total Chunks:",
    build_result["total_chunks"]
)


# -----------------------------------------
# 3. Semantic Search Test
# -----------------------------------------

print("\n3. Semantic Search")

# Intentionally avoid using the exact
# "person overboard" wording.
query = (
    "What should the crew do when "
    "someone falls into the sea?"
)

print("Query:", query)

results = vector_service.semantic_search(
    query=query,
    limit=5
)

print("Results Found:", len(results))


# -----------------------------------------
# 4. Display Results
# -----------------------------------------

for index, result in enumerate(
    results,
    start=1
):

    print(
        f"\nRESULT {index}"
    )

    print(
        "Source:",
        result["source"]
    )

    print(
        "Type:",
        result["file_type"]
    )

    print(
        "Chunk:",
        result["chunk_id"]
    )

    print(
        "Similarity:",
        result["similarity_score"]
    )

    print(
        "Content:",
        result["content"][:300]
    )