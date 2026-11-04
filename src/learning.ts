import { items, scenarios, sources } from "./data";
import type { ItemId, ItemStatus, KitEntry, Scenario } from "./data";

export function sameSelection(selected: number[], expected: number[]): boolean {
  const unique = new Set(selected);
  return (
    unique.size === expected.length &&
    expected.every((value) => unique.has(value))
  );
}

export interface TripSettings {
  duration: "short" | "medium" | "long";
  kind: "city" | "sea" | "road" | "flight";
  children: boolean;
  personal: boolean;
}
export interface HikeSettings {
  days: "one" | "multiple";
  remote: boolean;
  group: boolean;
}
export interface KitPlan {
  entries: KitEntry[];
  notes: string[];
}

export const defaultTrip: TripSettings = {
  duration: "medium",
  kind: "city",
  children: false,
  personal: false,
};
export const defaultHike: HikeSettings = {
  days: "one",
  remote: false,
  group: false,
};

/** Подбирает позиции для поездки без назначения препаратов и дозировок. */
export function travelPlan(settings: TripSettings): KitPlan {
  const entries: KitEntry[] = [
    "patches",
    "gauze",
    "bandage",
    "gloves",
    "antiseptic",
    "thermometer",
    "digestion",
    "pain",
  ].map((id) => ({
    id: id as ItemId,
    status:
      items[id as ItemId].category === "personal" ? "personal" : "recommended",
  }));
  const notes = [
    "Это учебная подборка. Количество расходников соотнесите с числом путешественников и доступностью аптек.",
  ];
  if (settings.kind === "sea") entries.push({ id: "sun" }, { id: "repellent" });
  if (settings.kind === "road" || settings.kind === "flight")
    entries.push({ id: "motion", status: "personal" });
  if (settings.kind === "flight")
    notes.push(
      "Перед перелётом проверьте правила ручной клади и ввоза лекарств в страну назначения.",
    );
  if (settings.personal)
    entries.push(
      { id: "personal", status: "personal" },
      { id: "prescriptions" },
    );
  if (settings.children)
    notes.push(
      "Для детей согласуйте состав с педиатром; проверьте возрастные ограничения и подходящие формы препаратов.",
    );
  if (settings.duration === "long") {
    for (const entry of entries) {
      if (entry.status === "personal")
        entry.quantity = "На весь срок по назначению";
      else if (
        ["dressings", "gloves", "patches", "antiseptic"].includes(
          items[entry.id].category,
        )
      )
        entry.quantity = "С запасом на срок поездки";
    }
    notes.push(
      "Поездка больше двух недель: заранее рассчитайте запас назначенных лекарств на весь срок и возможную задержку.",
    );
  }
  if (settings.duration === "short")
    notes.push(
      "Для короткой поездки соберите компактный набор в доступной сумке.",
    );
  return { entries, notes };
}

export function hikingPlan(settings: HikeSettings): KitPlan {
  const scenario = scenarios.find((scenario) => scenario.id === "hiking")!;
  const entries = scenario.kit.map((entry) => ({ ...entry }));
  const notes = [
    "Защитите набор от влаги и разместите его так, чтобы быстро достать. Проверьте индивидуальные риски участников.",
  ];
  if (settings.days === "multiple") {
    for (const entry of entries)
      if (
        ["gauze", "bandage", "patches", "blister", "gloves"].includes(entry.id)
      )
        entry.quantity = "Увеличенный запас";
      else if (entry.status === "personal")
        entry.quantity = "На весь маршрут по назначению";
    notes.push(
      "На несколько дней увеличьте запас перевязочных материалов и личных лекарств с учётом маршрута.",
    );
  }
  if (settings.remote)
    notes.push(
      "На удалённом маршруте заранее продумайте связь, эвакуацию и обучение первой помощи. Спасательное покрывало держите под рукой.",
    );
  if (settings.group) {
    notes.push(
      "Для группы распределите общий набор и личные препараты. Назначьте того, кто проверит комплект перед выходом.",
    );
    for (const entry of entries)
      if (entry.id === "gloves" || entry.id === "blanket")
        entry.quantity = "По числу участников и рискам";
  }
  return { entries, notes };
}

export const comparisonCategories = [
  ["dressings", "Перевязочные материалы"],
  ["gloves", "Медицинские перчатки"],
  ["antiseptic", "Антисептик"],
  ["thermometer", "Термометр"],
  ["blanket", "Спасательное покрывало"],
  ["personal", "Индивидуальные лекарства"],
  ["scissors", "Ножницы"],
  ["elastic", "Поддерживающий эластичный бинт"],
  ["patches", "Пластыри"],
  ["special", "Специальные средства и оснащение"],
] as const;

export function categoryStatus(
  scenario: Scenario,
  category: string,
): ItemStatus | undefined {
  const entry = scenario.kit.find(
    (entry) => items[entry.id].category === category,
  );
  if (!entry) return undefined;
  return entry.status ?? (scenario.normative ? "required" : "recommended");
}

export function checklistText(
  scenario: Scenario,
  entries: KitEntry[],
  checked: string[],
  notes: string[],
): string {
  const lines = entries.map(
    (entry) =>
      `${checked.includes(entry.id) ? "[x]" : "[ ]"} ${items[entry.id].name}${entry.quantity ? ` — ${entry.quantity}` : ""}${entry.detail ? ` (${entry.detail})` : ""}`,
  );
  const references = scenario.sources.map(
    (identifier) =>
      `${identifier}: ${sources[identifier].detail} — ${sources[identifier].url}`,
  );
  return [
    `Аптечка · ${scenario.label}`,
    scenario.normative
      ? "Нормативный состав. Минимальные количества."
      : "Рекомендательная учебная подборка.",
    "",
    ...lines,
    "",
    ...notes,
    "",
    "Источники:",
    ...references,
  ].join("\n");
}
