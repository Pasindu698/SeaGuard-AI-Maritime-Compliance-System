from backend.services.hybrid_retrieval_service import (
    hybrid_retrieval_service
)


print("=== SeaGuard AI Hybrid Retrieval Test ===")

query = (
    "What should the crew do when "
    "someone falls into the sea?"
)

print("\nQuery:")
print(query)

results = hybrid_retrieval_service.search(
    query=query,
    limit=5
)

print("\nResults Found:", len(results))

for index, result in enumerate(
    results,
    start=1
):
    print(f"\nRESULT {index}")

    print(
        "Source:",
        result["source"]
    )

    print(
        "Detected Incident:",
        result["detected_incident"]
    )

    print(
        "Keyword Score:",
        result["keyword_score"]
    )

    print(
        "Vector Similarity:",
        result["similarity_score"]
    )

    print(
        "Hybrid Score:",
        result["hybrid_score"]
    )

    print(
        "Content:",
        result["content"][:300]
    )