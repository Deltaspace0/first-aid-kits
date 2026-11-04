import { useState } from "react";
import { carQuestions, homeChoices, sources, workQuestions } from "../data";
import type { Scenario } from "../data";
import {
  defaultHike,
  defaultTrip,
  hikingPlan,
  sameSelection,
  travelPlan,
} from "../learning";
import type { HikeSettings, TripSettings } from "../learning";
import { Icon } from "./Icon";
import { KitChecklist } from "./KitChecklist";
import { Quiz } from "./Quiz";
import { SourceLinks } from "./SourceLinks";

/** Связывает описание сценария, его настройки, состав и учебное задание. */
export function ScenarioSection({ scenario }: { scenario: Scenario }) {
  const [trip, setTrip] = useState<TripSettings>(defaultTrip);
  const [hike, setHike] = useState<HikeSettings>(defaultHike);
  const plan =
    scenario.id === "travel"
      ? travelPlan(trip)
      : scenario.id === "hiking"
        ? hikingPlan(hike)
        : { entries: scenario.kit, notes: [] };
  return (
    <section
      id="scenario-detail"
      className="scenario-section section-anchor"
      aria-label={`Сценарий: ${scenario.label}`}
    >
      <div className="scenario-layout">
        <div className="scenario-intro">
          <figure>
            <img src={scenario.image} alt={scenario.imageAlt} loading="lazy" />
            <figcaption>
              <Icon name={scenario.icon} size={15} />
              {scenario.label} · своя ситуация, свой набор
            </figcaption>
          </figure>
          <p className="photo-note">
            <Icon name="info" size={13} />
            Фотография показывает ситуацию. Состав указан в списке предметов.
          </p>

          <div className="scenario-intro-copy">
            <span
              className={`pill ${scenario.normative ? "normative-pill" : ""}`}
            >
              <Icon name={scenario.normative ? "shield" : "heart"} size={14} />
              {scenario.normative
                ? "Нормативный состав"
                : "Рекомендательный состав"}
            </span>
            <h2>{scenario.title}</h2>
            <p>{scenario.description}</p>
            <div className="priority">
              <Icon name="info" size={19} />
              <p>{scenario.priority}</p>
            </div>
            {scenario.regulation && (
              <a
                className="regulation"
                href={sources[scenario.regulation].url}
                target="_blank"
                rel="noreferrer"
              >
                {sources[scenario.regulation].detail}
                <Icon name="external" size={13} />
              </a>
            )}
          </div>
        </div>
        <div className="scenario-kit">
          {scenario.id === "travel" && (
            <TravelSettings settings={trip} onChange={setTrip} />
          )}
          {scenario.id === "hiking" && (
            <HikingSettings settings={hike} onChange={setHike} />
          )}
          {plan.notes.length > 0 && (
            <div className="plan-notes" aria-live="polite">
              <Icon name="info" size={21} />
              <div>
                <strong>Под ваши условия</strong>
                {plan.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          )}
          <KitChecklist scenario={scenario} entries={plan.entries} />
        </div>
      </div>
      {scenario.id === "home" && <HomePractice />}
      {scenario.id === "car" && (
        <Quiz
          questions={carQuestions}
          title="Практика · проверьте комплектность"
        />
      )}
      {scenario.id === "work" && (
        <Quiz questions={workQuestions} title="Практика · найдите ошибки" />
      )}
      <SourceLinks identifiers={scenario.sources} />
    </section>
  );
}

/** Настраивает рекомендации с учётом поездки и личных потребностей. */
function TravelSettings({
  settings,
  onChange,
}: {
  settings: TripSettings;
  onChange: (settings: TripSettings) => void;
}) {
  return (
    <div className="configurator">
      <div className="configurator-heading">
        <span className="eyebrow">
          МАЛЕНЬКАЯ ПОДГОТОВКА — СПОКОЙНЕЕ ПОЕЗДКА
        </span>
        <h3>Настройте набор под путешествие</h3>
        <p className="muted">Измените условия — список ниже подстроится.</p>
      </div>
      <div className="configurator-fields">
        <label>
          Длительность поездки
          <select
            value={settings.duration}
            onChange={(event) =>
              onChange({
                ...settings,
                duration: event.target.value as TripSettings["duration"],
              })
            }
          >
            <option value="short">1–3 дня</option>
            <option value="medium">4–14 дней</option>
            <option value="long">Больше 14 дней</option>
          </select>
        </label>
        <label>
          Тип поездки
          <select
            value={settings.kind}
            onChange={(event) =>
              onChange({
                ...settings,
                kind: event.target.value as TripSettings["kind"],
              })
            }
          >
            <option value="city">Город</option>
            <option value="sea">Море</option>
            <option value="road">Дальняя дорога</option>
            <option value="flight">Перелёт</option>
          </select>
        </label>
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.children}
            onChange={(event) =>
              onChange({ ...settings, children: event.target.checked })
            }
          />
          Путешествую с детьми
        </label>
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.personal}
            onChange={(event) =>
              onChange({ ...settings, personal: event.target.checked })
            }
          />
          Есть индивидуальные препараты
        </label>
      </div>
    </div>
  );
}

/** Учитывает длительность, участников и удалённость похода. */
function HikingSettings({
  settings,
  onChange,
}: {
  settings: HikeSettings;
  onChange: (settings: HikeSettings) => void;
}) {
  return (
    <div className="configurator">
      <div className="configurator-heading">
        <span className="eyebrow">ПРОДУМАЙТЕ МАРШРУТ ЗАРАНЕЕ</span>
        <h3>Что взять в ваш поход?</h3>
        <p className="muted">Чем дальше помощь, тем важнее подготовка.</p>
      </div>
      <div className="configurator-fields">
        <label>
          Продолжительность
          <select
            value={settings.days}
            onChange={(event) =>
              onChange({
                ...settings,
                days: event.target.value as HikeSettings["days"],
              })
            }
          >
            <option value="one">Один день</option>
            <option value="multiple">Несколько дней</option>
          </select>
        </label>
        <label>
          Участники
          <select
            value={settings.group ? "group" : "solo"}
            onChange={(event) =>
              onChange({ ...settings, group: event.target.value === "group" })
            }
          >
            <option value="solo">Иду один / одна</option>
            <option value="group">Идём группой</option>
          </select>
        </label>
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.remote}
            onChange={(event) =>
              onChange({ ...settings, remote: event.target.checked })
            }
          />
          Удалённый маршрут, помощь далеко
        </label>
      </div>
    </div>
  );
}

/** Объясняет выбор базовых предметов, включая неподходящие варианты. */
function HomePractice() {
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const expected = homeChoices.flatMap((choice, index) =>
    choice.correct ? [index] : [],
  );
  function toggle(index: number) {
    setSubmitted(false);
    setSelected((previous) =>
      previous.includes(index)
        ? previous.filter((value) => value !== index)
        : [...previous, index],
    );
  }
  return (
    <section className="home-practice">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">
            <Icon name="book" size={14} />
            ПОПРОБУЙТЕ НА ПРАКТИКЕ
          </span>
          <h3>Соберите домашнюю аптечку</h3>
          <p className="muted">Отметьте подходящие позиции из предложенных.</p>
        </div>
        <span className="time-label">
          <Icon name="clock" size={15} />1 минута
        </span>
      </div>
      <div className="practice-grid">
        {homeChoices.map((choice, index) => (
          <label
            key={choice.label}
            className={`practice-choice ${selected.includes(index) ? "selected" : ""} ${submitted ? (choice.correct ? "answer-correct" : "answer-wrong") : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(index)}
              onChange={() => toggle(index)}
            />
            <img
              className="practice-image"
              src={choice.image}
              alt=""
              width={140}
              height={140}
              loading="lazy"
              decoding="async"
            />
            <strong>{choice.label}</strong>
            {submitted && <span>{choice.explanation}</span>}
          </label>
        ))}
      </div>
      {submitted && (
        <div className="practice-feedback" role="status">
          <Icon name={sameSelection(selected, expected) ? "shield" : "info"} />
          <div>
            <strong>
              {sameSelection(selected, expected)
                ? "Всё верно! Основа собрана."
                : "Посмотрите объяснения на карточках"}
            </strong>
            <p>
              {sameSelection(selected, expected)
                ? "В настоящем наборе также учтите средства ухода, инструкции и личные назначения семьи."
                : "В этом задании подходят салфетки и бинты, перчатки, термометр и пластыри. Таблетки без упаковки и антибиотики для самолечения не подходят."}
            </p>
          </div>
        </div>
      )}
      <div className="practice-actions">
        <span className="small muted">
          Это упражнение — часть набора, а не полный перечень.
        </span>
        <button
          className="button primary"
          disabled={!selected.length}
          onClick={() => {
            if (submitted) {
              setSelected([]);
              setSubmitted(false);
            } else setSubmitted(true);
          }}
        >
          {submitted ? "Попробовать ещё раз" : "Проверить набор"}
          <Icon name={submitted ? "rotate" : "arrow"} size={17} />
        </button>
      </div>
    </section>
  );
}
