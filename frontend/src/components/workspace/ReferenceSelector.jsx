import { BookOpen, SlidersHorizontal } from "lucide-react";

const OPTIONS = [3, 5, 10, 15, 20];

export default function ReferenceSelector({
  referenceLimit,
  onReferenceLimitChange,
  disabled = false,
}) {
  return (
    <div className="aiw-retrieval-selector">
      <div className="aiw-retrieval-selector-info">
        <div className="aiw-retrieval-selector-icon">
          <BookOpen size={20} />
        </div>

        <div>
          <strong>Reference Retrieval Limit</strong>
          <p>
            Choose how many maritime reference matches
            the AI should request.
          </p>
        </div>
      </div>

      <div className="aiw-retrieval-selector-control">
        <SlidersHorizontal size={17} />

        <select
          value={referenceLimit}
          disabled={disabled}
          onChange={(e) =>
            onReferenceLimitChange(Number(e.target.value))
          }
          aria-label="Reference retrieval limit"
        >
          {OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count} References
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}