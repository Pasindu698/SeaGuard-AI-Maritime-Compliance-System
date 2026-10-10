
export function getReferenceKey(reference, index) {
  return (
    reference.source ||
    reference.filename ||
    `unknown-${index}`
  );
}

export function buildSourceGroups(references = []) {
  if (!Array.isArray(references)) return [];

  const groups = new Map();

  references.forEach((reference, index) => {
    const key = getReferenceKey(reference, index);

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        filename: reference.filename || "Maritime Reference",
        bestScore: -Infinity,
        evidenceItems: [],
      });
    }

    const group = groups.get(key);
    const score = Number(reference.hybrid_score);

    if (
      reference.hybrid_score != null &&
      Number.isFinite(score)
    ) {
      group.bestScore = Math.max(group.bestScore, score);
    }

    const evidence = String(reference.evidence || "").trim();

    if (
      evidence &&
      !group.evidenceItems.includes(evidence)
    ) {
      group.evidenceItems.push(evidence);
    }
  });

  return Array.from(groups.values())
    .sort((a, b) => b.bestScore - a.bestScore)
    .map((group, index) => ({
      ...group,
      citationId: `SRC-${String(index + 1).padStart(2, "0")}`,
    }));
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function findSupportingSources(requirement, sourceGroups) {
  const requirementText = normalizeText(requirement);

  if (!requirementText) return [];

  return sourceGroups.filter((group) =>
    group.evidenceItems.some((evidence) =>
      normalizeText(evidence).includes(requirementText)
    )
  );
}
