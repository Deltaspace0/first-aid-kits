import { describe, expect, it } from "vitest";
import {
  carQuestions,
  finalQuestions,
  homeChoices,
  items,
  itemStatus,
  scenarios,
  sources,
  storageQuestions,
  workQuestions,
} from "./data";
import {
  categoryStatus,
  checklistText,
  defaultHike,
  defaultTrip,
  hikingPlan,
  sameSelection,
  travelPlan,
} from "./learning";

describe("Комплекты и российские нормативные требования", () => {
  const car = scenarios.find((scenario) => scenario.id === "car")!;
  const work = scenarios.find((scenario) => scenario.id === "work")!;

  it("различает нормативные и рекомендательные сценарии", () => {
    expect(
      scenarios
        .filter((scenario) => scenario.normative)
        .map((scenario) => scenario.id),
    ).toEqual(["car", "work"]);
    for (const scenario of scenarios)
      for (const entry of scenario.kit) {
        expect(itemStatus(scenario, entry)).toBe(
          scenario.normative ? "required" : (entry.status ?? "recommended"),
        );
      }
  });

  it("учитывает различие количеств бинтов и покрывал между 260н и 262н", () => {
    for (const identifier of ["bandage", "wideBandage"]) {
      expect(car.kit.find((entry) => entry.id === identifier)?.quantity).toBe(
        "3 шт.",
      );
      expect(work.kit.find((entry) => entry.id === identifier)?.quantity).toBe(
        "4 шт.",
      );
    }
    expect(car.kit.find((entry) => entry.id === "blanket")?.quantity).toBe(
      "1 шт.",
    );
    expect(work.kit.find((entry) => entry.id === "blanket")?.quantity).toBe(
      "2 шт.",
    );
  });

  it("включает дополнительные рабочие пластыри, блокнот и письменные принадлежности", () => {
    expect(work.kit.find((entry) => entry.id === "patches")?.quantity).toBe(
      "10 шт.",
    );
    expect(
      work.kit.find((entry) => entry.id === "largePatches")?.quantity,
    ).toBe("2 шт.");
    expect(car.kit).toHaveLength(14);
    expect(work.kit).toHaveLength(16);
    for (const scenario of [car, work]) {
      expect(
        scenario.kit.find((entry) => entry.id === "gloves")?.quantity,
      ).toBe("2 пары");
      expect(
        scenario.kit.find((entry) => entry.id === "breathing")?.quantity,
      ).toBe("2 шт.");
      expect(scenario.kit.map((entry) => entry.id)).toEqual(
        expect.arrayContaining(["notebook", "marker", "instructions", "case"]),
      );
    }
  });

  it("сохраняет уникальность компонентов и действительные ссылки на источники", () => {
    for (const scenario of scenarios) {
      expect(new Set(scenario.kit.map((entry) => entry.id)).size).toBe(
        scenario.kit.length,
      );
      for (const identifier of scenario.sources)
        expect(sources[identifier].url).toMatch(/^https:\/\//);
    }
    for (const item of Object.values(items))
      expect(sources[item.source]).toBeDefined();
  });

  it("не выдаёт антисептики и личные лекарства за нормативный состав", () => {
    expect(categoryStatus(car, "antiseptic")).toBeUndefined();
    expect(categoryStatus(work, "personal")).toBeUndefined();
    expect(categoryStatus(scenarios[0], "personal")).toBe("personal");
    expect(categoryStatus(scenarios[0], "thermometer")).toBe("recommended");
  });

  it("содержит хранение и сроки для каждого предмета и различает расходники и приборы", () => {
    for (const item of Object.values(items)) {
      expect(item.care.storage.length).toBeGreaterThan(30);
      expect(item.care.shelfLife.length).toBeGreaterThan(30);
      if ("source" in item.care)
        expect(sources[item.care.source]).toBeDefined();
    }
    expect(items.gauze.care.shelfLife).toContain("стерильные");
    expect(items.personal.care.shelfLife).toContain("После вскрытия");
    expect(items.thermometer.care.shelfLife).toContain("срок службы");
    expect(items.notebook.care.shelfLife).toContain(
      "Медицинского срока годности нет",
    );
  });
});

describe("Адаптация набора к условиям", () => {
  it("добавляет защиту от солнца и насекомых для моря", () => {
    const baseline = travelPlan(defaultTrip);
    const sea = travelPlan({ ...defaultTrip, kind: "sea" });
    expect(baseline.entries.map((entry) => entry.id)).not.toContain("sun");
    expect(sea.entries.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["sun", "repellent"]),
    );
  });

  it("учитывает перелёт, детей и личные назначения без автоматического назначения детских лекарств", () => {
    const plan = travelPlan({
      duration: "long",
      kind: "flight",
      children: true,
      personal: true,
    });
    expect(plan.entries.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["motion", "personal", "prescriptions"]),
    );
    expect(plan.notes.join(" ")).toMatch(/педиатром/);
    expect(plan.notes.join(" ")).toMatch(/страну назначения/);
    expect(
      plan.entries.find((entry) => entry.id === "personal")?.quantity,
    ).toBe("На весь срок по назначению");
    expect(new Set(plan.entries.map((entry) => entry.id)).size).toBe(
      plan.entries.length,
    );
    expect(
      plan.entries.find((entry) => entry.id === "thermometer")?.quantity,
    ).toBeUndefined();
    expect(
      plan.entries.find((entry) => entry.id === "prescriptions")?.quantity,
    ).toBeUndefined();
  });

  it("не меняет исходные данные при настройке длительного похода", () => {
    const baseline = hikingPlan(defaultHike);
    const expanded = hikingPlan({
      days: "multiple",
      group: true,
      remote: true,
    });
    expect(
      baseline.entries.find((entry) => entry.id === "gauze")?.quantity,
    ).toBeUndefined();
    expect(
      expanded.entries.find((entry) => entry.id === "gauze")?.quantity,
    ).toBe("Увеличенный запас");
    expect(
      expanded.entries.find((entry) => entry.id === "blanket")?.quantity,
    ).toMatch(/участников/);
    expect(expanded.notes.join(" ")).toMatch(/эвакуацию/);
    expect(hikingPlan(defaultHike)).toEqual(baseline);
  });

  it("возвращает компактный сценарий для короткой поездки", () => {
    expect(
      travelPlan({ ...defaultTrip, duration: "short" }).notes.join(" "),
    ).toMatch(/компактный/);
    expect(
      travelPlan(defaultTrip).entries.some((entry) => entry.id === "personal"),
    ).toBe(false);
  });
});

describe("Учебные задания", () => {
  it("проверяет все правильные варианты независимо от порядка", () => {
    expect(sameSelection([3, 1], [1, 3])).toBe(true);
    expect(sameSelection([1], [1, 3])).toBe(false);
    expect(sameSelection([1, 2, 3], [1, 3])).toBe(false);
    expect(sameSelection([], [0])).toBe(false);
  });

  it("содержит восемь итоговых вопросов с корректными ответами и источниками", () => {
    expect(finalQuestions).toHaveLength(8);
    for (const question of [
      ...finalQuestions,
      ...carQuestions,
      ...workQuestions,
      ...storageQuestions,
    ]) {
      expect(question.correct.length).toBeGreaterThan(0);
      expect(question.explanation.length).toBeGreaterThan(30);
      for (const index of question.correct)
        expect(question.options[index]).toBeDefined();
      for (const identifier of question.sources)
        expect(sources[identifier]).toBeDefined();
      for (const identifier of question.referenceScenarios ?? [])
        expect(
          scenarios.find((scenario) => scenario.id === identifier)?.kit.length,
        ).toBeGreaterThan(0);
    }
    expect(homeChoices.filter((choice) => choice.correct)).toHaveLength(4);
  });

  it("связывает вопрос о нормативном составе со всеми пятью наборами", () => {
    const question = finalQuestions[1];
    expect(question.context).toContain("Нормативный состав");
    expect(question.referenceScenarios).toEqual(
      scenarios.map((scenario) => scenario.id),
    );
    expect(question.options).toHaveLength(scenarios.length);
    expect(
      question.correct.map((index) => question.referenceScenarios![index]),
    ).toEqual(
      scenarios
        .filter((scenario) => scenario.normative)
        .map((scenario) => scenario.id),
    );
  });

  it("экспортирует отметки, размеры и ссылки, не изменяя набор", () => {
    const scenario = scenarios.find((scenario) => scenario.id === "car")!;
    const text = checklistText(
      scenario,
      scenario.kit,
      ["gloves"],
      ["Проверить упаковки"],
    );
    expect(text).toContain("[x] Медицинские перчатки — 2 пары");
    expect(text).toContain("[ ] Медицинские маски — 2 шт.");
    expect(text).toContain("5 м × 10 см");
    expect(text).toContain(sources.S02.url);
    expect(text).toContain("Проверить упаковки");
  });
});
