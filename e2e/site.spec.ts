import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { homedir } from "node:os";
import { join } from "node:path";

/** Загружает все картинки перед проверкой и снимком, включая находящиеся ниже экрана. */
async function expectItemImages(pictures: Locator) {
  await pictures.evaluateAll((images) =>
    Promise.all(
      images.map((element) => {
        const image = element as HTMLImageElement;
        image.loading = "eager";
        return image.decode();
      }),
    ),
  );
  await expect(pictures.first()).toHaveJSProperty("naturalWidth", 512);
}

/** Проверяет колонки на широком экране и последовательность блоков на телефоне. */
async function expectScenarioLayout(detail: Locator) {
  const bounds = await detail.evaluate((element) => {
    const overview = element
      .querySelector(".scenario-intro")!
      .getBoundingClientRect();
    const kit = element.querySelector(".scenario-kit")!.getBoundingClientRect();
    return {
      width: innerWidth,
      overviewRight: overview.right,
      overviewBottom: overview.bottom,
      overviewTop: overview.top,
      kitLeft: kit.left,
      kitTop: kit.top,
    };
  });
  if (bounds.width > 800) {
    expect(bounds.kitLeft).toBeGreaterThan(bounds.overviewRight);
    expect(Math.abs(bounds.kitTop - bounds.overviewTop)).toBeLessThan(1);
  } else {
    expect(bounds.kitTop).toBeGreaterThanOrEqual(bounds.overviewBottom);
  }
}

test("домашнее упражнение объясняет выбор, автомобильный тест объясняет ошибку", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const practice = page.locator(".home-practice");
  await expectItemImages(practice.locator(".practice-image"));
  await practice.screenshot({
    path: join(
      homedir(),
      "codex_output/first-aid-kits/scenario-layout",
      `${testInfo.project.name}-practice.png`,
    ),
    scale: "css",
  });
  for (const index of [0, 1, 2, 3])
    await practice.getByRole("checkbox").nth(index).check();
  await practice.getByRole("button", { name: "Проверить набор" }).click();
  await expect(practice.getByRole("status")).toContainText("Всё верно");
  await practice.getByRole("button", { name: "Попробовать ещё раз" }).click();
  await expect(practice.getByRole("checkbox").first()).not.toBeChecked();
  await page
    .locator(".scenario-card")
    .filter({ hasText: "Автомобиль" })
    .click();
  const quiz = page.locator("#scenario-detail .quiz");
  await expect(quiz.locator(".question-context")).toContainText(
    "Все остальные позиции из приказа № 260н есть в нужном количестве",
  );
  const reference = quiz.locator(".quiz-reference");
  await reference
    .getByText("Посмотреть состав набора", { exact: true })
    .click();
  await expect(reference.locator(".item-row")).toHaveCount(14);
  await expect(
    reference.getByRole("button", {
      name: "Подробнее: Спасательное покрывало",
    }),
  ).toContainText("1 шт.");
  await reference
    .getByText("Посмотреть состав набора", { exact: true })
    .click();
  await quiz.getByRole("radio").first().check();
  await quiz.getByRole("button", { name: "Показать ответ" }).click();
  await expect(quiz.getByRole("status")).toContainText("Разберёмся вместе");
  await expect(quiz.getByRole("status")).toContainText("2 пары перчаток");
});

test("карточки предметов работают без браузерного хранилища и открываются с клавиатуры", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Unavailable", "SecurityError");
      },
    }),
  );
  await page.goto("/");
  const detail = page.locator("#scenario-detail");
  const item = detail.getByRole("button", {
    name: "Подробнее: Стерильные салфетки",
  });
  await item.locator("img").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Закрыть карточку" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(item).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    detail.locator(".kit-checklist").getByRole("checkbox"),
  ).toHaveCount(0);
});

/** Проверяет расположение состава, настройки всех пяти наборов и открытие карточек. */
test("сценарии, настройки и открытие предметов вместо отметок", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      "first-aid-kits:checklists:v1",
      JSON.stringify({ home: ["gauze"] }),
    ),
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Аптечки дляразных ситуаций",
  );
  await expect(page.locator(".scenario-card")).toHaveCount(5);
  const detail = page.locator("#scenario-detail");
  await expect(
    detail.locator(".kit-checklist").getByRole("checkbox"),
  ).toHaveCount(0);
  await expect(
    detail.getByRole("button", { name: "Скачать список" }),
  ).toHaveCount(0);
  await expect(detail.locator(".item-info")).toHaveCount(0);
  await expect(detail.getByRole("progressbar")).toHaveCount(0);
  await expectScenarioLayout(detail);
  await expectItemImages(detail.locator(".item-symbol img"));
  await detail.locator(".scenario-layout").screenshot({
    path: join(
      homedir(),
      "codex_output/first-aid-kits/scenario-layout",
      `${testInfo.project.name}-home-layout.png`,
    ),
    scale: "css",
    style: ".skip-link { visibility: hidden; }",
  });
  const item = detail.getByRole("button", {
    name: "Подробнее: Стерильные салфетки",
  });
  await item.getByText("Стерильные салфетки", { exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByRole("img", { name: "Стерильные салфетки" }),
  ).toHaveJSProperty("naturalWidth", 512);
  await page.getByRole("dialog").screenshot({
    path: join(
      homedir(),
      "codex_output/first-aid-kits/scenario-layout",
      `${testInfo.project.name}-item-dialog.png`,
    ),
    scale: "css",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(detail.locator(".item-row")).toHaveCount(11);
  await expect(
    detail.locator(".kit-checklist").getByRole("checkbox"),
  ).toHaveCount(0);
  await page
    .locator(".scenario-card")
    .filter({ hasText: "Автомобиль" })
    .click();
  await expect(
    detail.getByRole("heading", { name: "Обязательный состав" }),
  ).toBeVisible();
  await expect(detail.locator(".item-row")).toHaveCount(14);
  await expectItemImages(detail.locator(".item-symbol img"));
  await page
    .locator(".scenario-card")
    .filter({ hasText: "Путешествие" })
    .click();
  await detail.getByLabel("Тип поездки").selectOption("sea");
  await expect(
    detail.getByRole("button", { name: "Подробнее: Солнцезащитное средство" }),
  ).toBeVisible();
  await detail.getByLabel("Путешествую с детьми").check();
  await expect(detail.locator(".plan-notes")).toContainText("педиатром");
  await detail.getByLabel("Есть индивидуальные препараты").check();
  await expect(
    detail.getByRole("button", {
      name: "Подробнее: Рецепты и список препаратов",
    }),
  ).toBeVisible();
  await expectScenarioLayout(detail);
  await expectItemImages(detail.locator(".item-symbol img"));
  await detail.locator(".scenario-layout").screenshot({
    path: join(
      homedir(),
      "codex_output/first-aid-kits/scenario-layout",
      `${testInfo.project.name}-travel-layout.png`,
    ),
    scale: "css",
    style: ".skip-link { visibility: hidden; }",
  });
  await page.locator(".scenario-card").filter({ hasText: "Поход" }).click();
  await detail.getByLabel("Продолжительность").selectOption("multiple");
  await detail.getByLabel("Удалённый маршрут").check();
  await expect(detail.locator(".plan-notes")).toContainText("эвакуацию");
  await expect(
    detail.locator(".item-row").filter({ hasText: "Стерильные салфетки" }),
  ).toContainText("Увеличенный запас");
  await expectItemImages(detail.locator(".item-symbol img"));
  await page.locator(".scenario-card").filter({ hasText: "Работа" }).click();
  await expect(detail.locator(".item-row")).toHaveCount(16);
  await expectItemImages(detail.locator(".item-symbol img"));
  await expect(
    detail.getByText("Нет беспрепятственного доступа"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

/** Проверяет справку внутри теста, сохранение выбора, подсчёт баллов и повтор. */
test("итоговый тест поддерживает несколько ответов, объяснения и повтор", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Проверить себя" }).click();
  const quiz = page.locator("#knowledge .quiz");
  const answers = [[1], [1, 4], [1], [0], [1], [0, 1], [1], [0]];
  for (let index = 0; index < answers.length; index++) {
    if (index > 0) {
      await expect(quiz.getByRole("heading", { level: 3 })).toBeFocused();
      await expect
        .poll(() =>
          page.evaluate(() => {
            const heading = document.querySelector("#knowledge .quiz h3")!;
            const header = document.querySelector(".site-header")!;
            return (
              heading.getBoundingClientRect().top >=
              header.getBoundingClientRect().bottom
            );
          }),
        )
        .toBe(true);
    }
    await expect(
      quiz.getByRole("button", { name: "Показать ответ" }),
    ).toBeDisabled();
    const choices = quiz.locator(".quiz-option input");
    for (const answer of answers[index]) await choices.nth(answer).check();
    if (index === 1) {
      await expect(quiz.getByRole("heading", { level: 3 })).toHaveText(
        "У каких из этих пяти аптечек состав установлен приказами Минздрава России?",
      );
      await expect(quiz.locator(".question-context")).toContainText(
        "Нормативный состав — обязательный перечень",
      );
      await expect(choices).toHaveCount(5);
      const reference = quiz.locator(".quiz-reference");
      const referenceToggle = reference.locator(":scope > summary");
      await referenceToggle.click();
      await expect(reference.locator(".quiz-reference-kit")).toHaveCount(5);
      const car = reference
        .locator(".quiz-reference-kit")
        .filter({ has: page.locator("summary", { hasText: "Автомобиль" }) });
      await car.locator(":scope > summary").click();
      await expect(car.locator(".item-row")).toHaveCount(14);
      const gloves = car.getByRole("button", {
        name: "Подробнее: Медицинские перчатки",
      });
      await expect(gloves).toContainText("2 пары");
      await gloves.click();
      await expect(page.getByRole("dialog")).toContainText(
        "Медицинские перчатки",
      );
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(gloves).toBeFocused();
      await expect(choices.nth(1)).toBeChecked();
      await expect(choices.nth(4)).toBeChecked();
      await expectItemImages(car.locator(".item-symbol img"));
      await reference.screenshot({
        path: join(
          homedir(),
          "codex_output/first-aid-kits/quiz-context",
          `${testInfo.project.name}-composition.png`,
        ),
        scale: "css",
        animations: "disabled",
        style: ".site-header, .skip-link { visibility: hidden; }",
      });
      await car.locator(":scope > summary").click();
      await quiz.screenshot({
        path: join(
          homedir(),
          "codex_output/first-aid-kits/quiz-context",
          `${testInfo.project.name}-question.png`,
        ),
        scale: "css",
        animations: "disabled",
        style: ".site-header, .skip-link { visibility: hidden; }",
      });
      await referenceToggle.click();
    }
    if (index === 2) {
      await expect(quiz.locator(".quiz-reference")).not.toHaveAttribute(
        "open",
        "",
      );
    }
    await quiz.getByRole("button", { name: "Показать ответ" }).click();
    await expect(quiz.getByRole("status")).toContainText("Всё верно");
    await quiz
      .getByRole("button", {
        name: index === 7 ? "Узнать результат" : "Следующий вопрос",
      })
      .click();
  }
  await expect(quiz.locator(".score")).toHaveText("8 из 8 правильных ответов");
  await quiz.getByText("Разобрать все ответы").click();
  await expect(quiz.locator(".answer-review>div")).toHaveCount(8);
  const normativeReview = quiz.locator(".answer-review>div").nth(1);
  await expect(normativeReview).toContainText(
    "Правильные ответы: Автомобильная; Для работников.",
  );
  await normativeReview.getByText("Посмотреть составы наборов").click();
  await expect(normativeReview.locator(".quiz-reference-kit")).toHaveCount(5);
  await quiz.getByRole("button", { name: "Попробовать ещё раз" }).click();
  await expect(
    quiz.getByRole("heading", { name: "Где лучше хранить домашнюю аптечку?" }),
  ).toBeVisible();
});

/** Проходит вопросы разделов, включая уточнённые ситуации на работе и хранение. */
test("вопросы разделов дают согласованные объяснения и результат", async ({
  page,
}) => {
  await page.goto("/");
  for (const label of ["Автомобиль", "Работа", "Хранение"]) {
    const storage = label === "Хранение";
    if (!storage) {
      await page.locator(".scenario-card").filter({ hasText: label }).click();
    }
    const quiz = page.locator(
      storage ? "#storage .quiz" : "#scenario-detail .quiz",
    );
    const answers =
      label === "Автомобиль" ? [[1], [0], [0, 1]] : [[1], [0], [1]];
    for (const [index, selection] of answers.entries()) {
      const choices = quiz.locator(".quiz-option input");
      for (const option of selection) await choices.nth(option).check();
      await quiz.getByRole("button", { name: "Показать ответ" }).click();
      await expect(quiz.getByRole("status")).toContainText("Всё верно");
      await expect(
        quiz.getByRole("status").locator("a").first(),
      ).toHaveAttribute("href", /^https:\/\//);
      await quiz
        .getByRole("button", {
          name: index === 2 ? "Узнать результат" : "Следующий вопрос",
        })
        .click();
    }
    await expect(quiz.locator(".score")).toHaveText(
      "3 из 3 правильных ответов",
    );
  }
});

/** Проверяет разные виды сроков, содержимое новых блоков и закрытие длинной карточки. */
test("карточки объясняют хранение и сроки годности, включая срок после вскрытия", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const detail = page.locator("#scenario-detail");
  const examples = [
    {
      scenario: "Дом",
      item: "Стерильные салфетки",
      storage: /заводской упаковке/,
      shelfLife: /нельзя оставлять в запасе как стерильные/,
    },
    {
      scenario: "Дом",
      item: "Индивидуальные лекарства",
      storage: /в холодильник помещайте только по его инструкции/,
      shelfLife: /более раннюю из двух предельных дат/,
    },
    {
      scenario: "Дом",
      item: "Термометр",
      storage: /защитном футляре/,
      shelfLife: /срок службы в паспорте/,
    },
    {
      scenario: "Автомобиль",
      item: "Блокнот",
      storage: /от намокания/,
      shelfLife: /Медицинского срока годности нет/,
    },
    {
      scenario: "Путешествие",
      item: "Солнцезащитное средство",
      storage: /раскалённом автомобиле/,
      shelfLife: /сроку после вскрытия/,
    },
    {
      scenario: "Путешествие",
      item: "Средство от насекомых",
      storage: /баллон берегите от нагрева/,
      shelfLife: /Время защиты от насекомых после нанесения/,
    },
  ];
  for (const example of examples) {
    await page
      .locator(".scenario-card")
      .filter({ hasText: example.scenario })
      .click();
    if (example.scenario === "Путешествие")
      await detail.getByLabel("Тип поездки").selectOption("sea");
    const item = detail.getByRole("button", {
      name: `Подробнее: ${example.item}`,
      exact: true,
    });
    await item.click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("region", { name: "Условия хранения" }),
    ).toContainText(example.storage);
    const shelfLife = dialog.getByRole("region", { name: "Срок годности" });
    await expect(shelfLife).toContainText(example.shelfLife);
    await shelfLife.scrollIntoViewIfNeeded();
    if (example.item === "Стерильные салфетки")
      await dialog.screenshot({
        path: join(
          homedir(),
          "codex_output/first-aid-kits/storage-shelf-life",
          `${testInfo.project.name}-item-care.png`,
        ),
        scale: "css",
      });
    await dialog.evaluate(
      (element) => (element.scrollTop = element.scrollHeight),
    );
    await expect(
      dialog.getByRole("button", { name: "Закрыть карточку" }),
    ).toBeInViewport();
    await dialog.getByRole("button", { name: "Закрыть карточку" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(item).toBeFocused();
  }
  const storage = page.locator("#storage");
  await expect(
    storage.getByRole("heading", { name: "Хранение и сроки годности" }),
  ).toBeVisible();
  await expect(storage.locator(".storage-details dt")).toHaveCount(8);
  await storage.screenshot({
    path: join(
      homedir(),
      "codex_output/first-aid-kits/storage-shelf-life",
      `${testInfo.project.name}-storage.png`,
    ),
    scale: "css",
    style: ".site-header, .skip-link { visibility: hidden; }",
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("адаптивная главная, сравнение, источники и прямые ссылки", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".hero-image")).toHaveJSProperty("complete", true);
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    window: innerWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.viewport).toBe(page.viewportSize()!.width);
  await page.screenshot({
    path: join(
      homedir(),
      "codex_output/first-aid-kits",
      `${testInfo.project.name}-home.png`,
    ),
    fullPage: testInfo.project.name === "desktop",
    scale: "css",
  });
  await page.locator("#comparison").getByLabel("Различия в наличии").check();
  await expect(page.locator("#comparison tbody tr")).toHaveCount(6);
  await expect(page.locator("#sources .source-card")).toHaveCount(13);
  await expect(page.locator("#sources a").first()).toHaveAttribute(
    "href",
    /consultant.ru/,
  );
  await page.goto("/#car");
  await expect(page.locator("#scenario-detail .item-row")).toHaveCount(14);
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Хранение" })
      .click();
    await expect(
      page.getByRole("button", { name: "Открыть меню" }),
    ).toHaveAttribute("aria-expanded", "false");
  }
});
