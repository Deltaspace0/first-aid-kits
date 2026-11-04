import { sources } from "../data";
import type { SourceId } from "../data";
import { Icon } from "./Icon";

export function SourceLinks({
  identifiers,
  compact = false,
}: {
  identifiers: readonly SourceId[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "source-links compact" : "source-links"}>
      <span>{compact ? "Источники:" : "Использованные источники"}</span>
      {identifiers.map((identifier) => (
        <a
          key={identifier}
          href={sources[identifier].url}
          target="_blank"
          rel="noreferrer"
        >
          {compact ? identifier : sources[identifier].detail}
          <Icon name="external" size={12} />
        </a>
      ))}
    </div>
  );
}
