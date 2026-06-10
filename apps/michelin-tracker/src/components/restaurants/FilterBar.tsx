"use client";

import { useCallback, useRef } from "react";

interface Filters {
  stars: string;
  country: string;
  cuisine: string;
}

interface Props {
  value: Filters;
  onChange: (f: Filters) => void;
}

const inputStyle: React.CSSProperties = {
  background: "var(--color-panel)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.375rem",
  padding: "0.375rem 0.625rem",
  fontSize: "0.8125rem",
  color: "var(--color-ink)",
  outline: "none",
  fontFamily: "var(--font-mono)",
  transition: "border-color 150ms, box-shadow 150ms",
};

export function FilterBar({ value, onChange }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debounce = useCallback(
    (updater: (prev: Filters) => Filters) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(updater(value));
      }, 300);
    },
    [value, onChange]
  );

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={value.stars}
        onChange={(e) => onChange({ ...value, stars: e.target.value })}
        style={inputStyle}
      >
        <option value="">All Stars</option>
        <option value="1">★ One Star</option>
        <option value="2">★★ Two Stars</option>
        <option value="3">★★★ Three Stars</option>
      </select>
      <input
        defaultValue={value.country}
        placeholder="Country…"
        onChange={(e) => {
          const v = e.target.value;
          debounce((prev) => ({ ...prev, country: v }));
        }}
        style={inputStyle}
      />
      <input
        defaultValue={value.cuisine}
        placeholder="Cuisine…"
        onChange={(e) => {
          const v = e.target.value;
          debounce((prev) => ({ ...prev, cuisine: v }));
        }}
        style={inputStyle}
      />
      {(value.stars || value.country || value.cuisine) && (
        <button
          onClick={() => onChange({ stars: "", country: "", cuisine: "" })}
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.375rem 0",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-ink)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
