import { useEffect, useState } from "react";
import { finalQuestions, heroImage, scenarios, sources } from "./data";
import type { ScenarioId, SourceId } from "./data";
import { Icon } from "./components/Icon";
import { ScenarioSection } from "./components/ScenarioSection";
import { Comparison } from "./components/Comparison";
import { Storage } from "./components/Storage";
import { Quiz } from "./components/Quiz";

function initialScenario(): ScenarioId {
  return (
    scenarios.find((scenario) => scenario.id === location.hash.slice(1))?.id ??
    "home"
  );
}

/** Объединяет разделы и сохраняет выбранный сценарий в адресе страницы. */
export default function App() {
  const [active, setActive] = useState<ScenarioId>(initialScenario);
  const [quizStarted, setQuizStarted] = useState(false);
  const scenario = scenarios.find((candidate) => candidate.id === active)!;

  useEffect(() => {
    const onHashChange = () => {
      const target = scenarios.find(
        (candidate) => candidate.id === location.hash.slice(1),
      );
      if (target) {
        setActive(target.id);
        requestAnimationFrame(() =>
          document.getElementById("scenario-detail")?.scrollIntoView(),
        );
      }
    };
    window.addEventListener("hashchange", onHashChange);
    if (scenarios.some((candidate) => candidate.id === location.hash.slice(1)))
      requestAnimationFrame(() =>
        document.getElementById("scenario-detail")?.scrollIntoView(),
      );
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function selectScenario(identifier: ScenarioId) {
    setActive(identifier);
    history.pushState(null, "", `#${identifier}`);
    requestAnimationFrame(() =>
      document
        .getElementById("scenario-detail")
        ?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  function startQuiz() {
    setQuizStarted(true);
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <Header onStartQuiz={startQuiz} />
      <main id="main" className="page-shell">
        <Hero />
        <div className="intro-strip">
          <div>
            <span className="strip-icon">
              <Icon name="shield" size={23} />
            </span>
            <p>
              <strong>Готовность начинается с простого</strong>
              <span>Знать, что положить. Понимать, как использовать.</span>
            </p>
          </div>
          <div className="intro-meta">
            <span>
              <Icon name="book" size={17} />
              Российские источники
            </span>
            <span className="meta-dot" />
            <span>Без сложных терминов</span>
          </div>
        </div>
        <ScenarioSelector active={active} selectScenario={selectScenario} />
        <div className="two-types">
          <span className="two-types-icon">
            <Icon name="info" size={22} />
          </span>
          <p>
            <strong>Обязательное или рекомендательное?</strong>
            <span>
              Для автомобиля и работы состав закреплён приказами. Для дома,
              путешествия и похода набор подбирают под свои условия.
            </span>
          </p>
          <a href="#sources" aria-label="Источники нормативных требований">
            <Icon name="arrow" size={21} />
          </a>
        </div>
        <ScenarioSection key={active} scenario={scenario} />
        <Comparison />
        <Storage />
        <Knowledge started={quizStarted} startQuiz={startQuiz} />
        <Sources />
      </main>
      <Footer />
    </>
  );
}

/** Обложка знакомит со всеми сценариями через исходный коллаж. */
function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <img
        className="hero-image"
        src={heroImage}
        alt="Пять ситуаций с аптечкой: дом, автомобиль, аэропорт, горный поход и офис"
        fetchPriority="high"
      />
      <div className="hero-shade" />
      <div className="hero-content">
        <span className="hero-label">
          <span />
          ИНТЕРАКТИВНЫЙ ГИД ПО ПЕРВОЙ ПОМОЩИ
        </span>
        <h1 id="hero-heading">
          Аптечки для
          <br />
          <em>разных ситуаций</em>
        </h1>
        <p>
          Сравни состав, узнай назначение предметов
          <br className="desktop-break" /> и собери свой набор.
        </p>
        <a href="#situations" className="button primary hero-button">
          Выбрать ситуацию
          <Icon name="arrow" size={18} />
        </a>
      </div>
      <div className="hero-bottom">
        <span>
          <Icon name="heart" size={16} />
          Пусть пригодятся только знания
        </span>
        <span>ДОМ · ДОРОГА · ПУТЕШЕСТВИЕ · ПРИРОДА · РАБОТА</span>
      </div>
    </section>
  );
}

/** Собирает нормативные документы и рекомендации в общий список. */
function Sources() {
  return (
    <section id="sources" className="sources-section section-anchor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ЗНАНИЯ, НА КОТОРЫЕ МОЖНО ОПЕРЕТЬСЯ</span>
          <h2>Проверяйте по первоисточнику</h2>
          <p className="muted">
            Российские нормативные документы и рекомендации специалистов.
          </p>
        </div>
        <span className="sources-count">
          {Object.keys(sources).length} источников
          <Icon name="external" size={15} />
        </span>
      </div>
      <div className="sources-grid">
        {(Object.keys(sources) as SourceId[]).map((identifier) => (
          <a
            href={sources[identifier].url}
            target="_blank"
            rel="noreferrer"
            className="source-card"
            key={identifier}
          >
            <span className="source-number">{identifier}</span>
            <span>
              <span className="source-organization">
                {sources[identifier].organization} · {sources[identifier].year}
              </span>
              <strong>{sources[identifier].title}</strong>
              <span className="source-detail-text">
                {sources[identifier].detail}
              </span>
            </span>
            <Icon name="external" size={17} />
          </a>
        ))}
      </div>
      <div className="editorial-note">
        <Icon name="info" size={19} />
        <p>
          Сайт — учебный материал, а не назначение лечения. Домашний, дорожный и
          походный наборы рекомендательные. Индивидуальные препараты подбирают с
          учётом рекомендаций врача и инструкций. Практическим навыкам первой
          помощи учатся отдельно. Актуальность требований проверяйте по ссылкам
          на документы.
        </p>
      </div>
    </section>
  );
}

/** Управляет мобильным меню и переходами к разделам сайта. */
function Header({ onStartQuiz }: { onStartQuiz: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="icon-button menu-button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={24} />
        </button>
        <nav
          className={menuOpen ? "navigation is-open" : "navigation"}
          aria-label="Основная навигация"
          onClick={() => setMenuOpen(false)}
        >
          <a href="#situations">Ситуации</a>
          <a href="#comparison">Сравнение</a>
          <a href="#storage">Хранение</a>
          <a href="#sources">Источники</a>
        </nav>
        <a
          className="button header-quiz"
          href="#knowledge"
          onClick={() => {
            onStartQuiz();
            setMenuOpen(false);
          }}
        >
          <Icon name="book" size={17} />
          Проверить себя
          <Icon name="arrow" size={16} />
        </a>
      </div>
    </header>
  );
}

/** Показывает все пять ситуаций и отмечает открытый сценарий. */
function ScenarioSelector({
  active,
  selectScenario,
}: {
  active: ScenarioId;
  selectScenario: (identifier: ScenarioId) => void;
}) {
  return (
    <section id="situations" className="situations section-anchor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            ПЯТЬ СИТУАЦИЙ. ОДНА ПРИВЫЧКА — БЫТЬ ГОТОВЫМ.
          </span>
          <h2>У каждой ситуации — своя аптечка</h2>
          <p className="muted">
            Выберите сценарий. Разберитесь в составе. Соберите свой набор.
          </p>
        </div>
        <a href="#comparison" className="text-link">
          Сравнить наборы
          <Icon name="arrow" size={17} />
        </a>
      </div>
      <div className="scenario-cards">
        {scenarios.map((candidate, index) => (
          <button
            key={candidate.id}
            className={`scenario-card ${active === candidate.id ? "active" : ""}`}
            aria-pressed={active === candidate.id}
            onClick={() => selectScenario(candidate.id)}
          >
            <span className="card-image">
              <img src={candidate.image} alt="" loading="lazy" />
              <span className="card-index">0{index + 1}</span>
              <span className="card-symbol">
                <Icon name={candidate.icon} size={20} />
              </span>
            </span>
            <span className="card-content">
              <span className="card-title">
                {candidate.label}
                <Icon name="arrow" size={19} />
              </span>
              <span className="card-description">{candidate.caption}</span>
              <span
                className={`card-type ${candidate.normative ? "regulated" : ""}`}
              >
                <span />
                {candidate.normative
                  ? "Нормативный состав"
                  : "Рекомендательный"}
              </span>
              <span className="card-open">
                {active === candidate.id
                  ? "Изучаем этот набор"
                  : "Открыть сценарий"}
                <Icon
                  name={active === candidate.id ? "check" : "chevron"}
                  size={15}
                />
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Открывает итоговую самопроверку по запросу пользователя. */
function Knowledge({
  started,
  startQuiz,
}: {
  started: boolean;
  startQuiz: () => void;
}) {
  return (
    <section
      id="knowledge"
      className={`knowledge section-anchor ${started ? "started" : ""}`}
    >
      <div className="knowledge-intro">
        <div className="knowledge-decoration" aria-hidden="true">
          <Icon name="plus" size={105} />
        </div>
        <span className="eyebrow">ЗНАТЬ — УЖЕ БЫТЬ ГОТОВЕЕ</span>
        <h2>
          А ваша аптечка
          <br />
          готова к жизни?
        </h2>
        <p>
          Проверьте, что запомнили. Восемь коротких вопросов
          <br className="desktop-break" /> помогут превратить знания в полезную
          привычку.
        </p>
        <div className="knowledge-meta">
          <span>
            <Icon name="list" size={16} />8 вопросов
          </span>
          <span>
            <Icon name="clock" size={16} />
            Около 5 минут
          </span>
        </div>
        {!started && (
          <button className="button cream-button" onClick={startQuiz}>
            Начать тест
            <Icon name="arrow" size={18} />
          </button>
        )}
      </div>
      {started && (
        <Quiz questions={finalQuestions} title="Итоговая самопроверка" final />
      )}
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          Небольшая подготовка.
          <br />
          Больше спокойствия каждый день.
        </p>
        <a href="#" className="back-top">
          Наверх
          <Icon name="arrow" size={17} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>Учебный проект о готовности к первой помощи · 2026</span>
        <span>Берегите себя и тех, кто рядом.</span>
      </div>
    </footer>
  );
}
