import { useEffect, useState } from "react";
import { items, scenarios } from "./data";
import type { ScenarioId } from "./data";

type Checklists = Record<ScenarioId, string[]>;
const storageKey = "first-aid-kits:checklists:v1";
const emptyChecklists = (): Checklists => ({
  home: [],
  car: [],
  travel: [],
  hiking: [],
  work: [],
});

function readChecklists(): Checklists {
  const checklists = emptyChecklists();
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    );
    if (!saved || typeof saved !== "object") return checklists;
    for (const { id } of scenarios) {
      const values: unknown = (saved as Record<string, unknown>)[id];
      if (Array.isArray(values))
        checklists[id] = [
          ...new Set(
            values.filter(
              (value): value is string =>
                typeof value === "string" && Object.hasOwn(items, value),
            ),
          ),
        ];
    }
  } catch {
    /* При запрете хранилища или повреждённых данных остаётся доступен обычный чек-лист. */
  }
  return checklists;
}

export function useChecklist() {
  const [checklists, setChecklists] = useState(readChecklists);
  const [persistent, setPersistent] = useState(true);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checklists));
      setPersistent(true);
    } catch {
      setPersistent(false);
    }
  }, [checklists]);

  function toggle(scenario: ScenarioId, item: string) {
    setChecklists((previous) => ({
      ...previous,
      [scenario]: previous[scenario].includes(item)
        ? previous[scenario].filter((value) => value !== item)
        : [...previous[scenario], item],
    }));
  }

  function reset(scenario: ScenarioId) {
    setChecklists((previous) => ({ ...previous, [scenario]: [] }));
  }

  return { checklists, persistent, toggle, reset };
}
