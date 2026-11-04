import { useId, useState } from "react";
import { scenarios } from "../data";
import type { Question } from "../data";
import { sameSelection } from "../learning";
import { Icon } from "./Icon";
import { KitChecklist } from "./KitChecklist";
import { SourceLinks } from "./SourceLinks";

/** Показывает по одному вопросу и объясняет ответ до перехода к следующему. */
export function Quiz({
  questions,
  title,
  final = false,
}: {
  questions: Question[];
  title: string;
  final?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [revealed, setRevealed] = useState(false);
  const headingId = useId();
  const finished = answers.length === questions.length && !revealed;
  const question = questions[index];
  const correct = sameSelection(selected, question.correct);

  function focusQuestion() {
    requestAnimationFrame(() => {
      const heading = document.getElementById(headingId);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start" });
    });
  }

  function restart() {
    setIndex(0);
    setSelected([]);
    setAnswers([]);
    setRevealed(false);
    focusQuestion();
  }

  function toggle(option: number) {
    if (revealed) return;
    setSelected((previous) =>
      question.correct.length === 1
        ? [option]
        : previous.includes(option)
          ? previous.filter((value) => value !== option)
          : [...previous, option],
    );
  }

  function advance() {
    setAnswers((previous) => [...previous, selected]);
    setRevealed(false);
    setSelected([]);
    if (index < questions.length - 1) setIndex(index + 1);
    focusQuestion();
  }

  return (
    <section
      className={`quiz ${final ? "quiz-final" : ""}`}
      aria-labelledby={headingId}
    >
      <div className="quiz-topline">
        <span className="eyebrow">
          <Icon name="book" size={15} /> {title}
        </span>
        <span className="muted">
          {finished ? "Готово" : `${index + 1} / ${questions.length}`}
        </span>
      </div>
      <div className="quiz-progress">
        <span
          style={{
            width: `${(finished ? 1 : index / questions.length) * 100}%`,
          }}
        />
      </div>
      {finished ? (
        <QuizResult
          questions={questions}
          answers={answers}
          headingId={headingId}
          restart={restart}
        />
      ) : (
        <>
          <h3 id={headingId} tabIndex={-1}>
            {question.title}
          </h3>
          {question.context && (
            <p className="question-context muted">{question.context}</p>
          )}
          <QuestionReference key={question.title} question={question} />
          <p className="question-instruction muted small">
            {question.correct.length > 1
              ? "Выберите все подходящие ответы"
              : "Выберите один ответ"}
          </p>
          <div
            className="quiz-options"
            role="group"
            aria-labelledby={headingId}
          >
            {question.options.map((option, optionIndex) => (
              <label
                key={option}
                className={`quiz-option ${revealed && question.correct.includes(optionIndex) ? "answer-correct" : ""} ${revealed && selected.includes(optionIndex) && !question.correct.includes(optionIndex) ? "answer-wrong" : ""}`}
              >
                <input
                  type={question.correct.length > 1 ? "checkbox" : "radio"}
                  name={headingId}
                  checked={selected.includes(optionIndex)}
                  onChange={() => toggle(optionIndex)}
                  disabled={revealed}
                />
                <span>{option}</span>
                {revealed && question.correct.includes(optionIndex) && (
                  <Icon name="check" size={18} />
                )}
              </label>
            ))}
          </div>
          {revealed && (
            <div
              className={`answer-explanation ${correct ? "positive" : "neutral"}`}
              role="status"
            >
              <strong>{correct ? "Всё верно!" : "Разберёмся вместе"}</strong>
              <p>{question.explanation}</p>
              <SourceLinks identifiers={question.sources} compact />
            </div>
          )}
          <div className="quiz-actions">
            <span className="small muted">
              {revealed
                ? "Понимать важнее, чем угадать"
                : "Каждый ответ — с объяснением"}
            </span>
            {revealed ? (
              <button className="button primary" onClick={advance}>
                {index === questions.length - 1
                  ? "Узнать результат"
                  : "Следующий вопрос"}
                <Icon name="arrow" size={17} />
              </button>
            ) : (
              <button
                className="button primary"
                disabled={!selected.length}
                onClick={() => setRevealed(true)}
              >
                Показать ответ
                <Icon name="arrow" size={17} />
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/** Открывает составы из каталога без перехода из теста и потери выбранных ответов. */
function QuestionReference({ question }: { question: Question }) {
  const [expanded, setExpanded] = useState(false);
  const identifiers = question.referenceScenarios;
  if (!identifiers?.length) return null;
  const kits = scenarios.filter((scenario) =>
    identifiers.includes(scenario.id),
  );
  return (
    <details
      className="quiz-reference"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        {kits.length === 1
          ? "Посмотреть состав набора"
          : "Посмотреть составы наборов"}
        <Icon name="chevron" size={16} />
      </summary>
      {expanded && (
        <div className="quiz-reference-content">
          <p className="muted small">
            Можно свериться со списком и открыть карточку любого предмета. Ваши
            выбранные ответы останутся на месте.
          </p>
          {kits.map((scenario) => (
            <details
              className="quiz-reference-kit"
              key={scenario.id}
              open={kits.length === 1}
            >
              <summary>
                <span>
                  <Icon name={scenario.icon} size={17} /> {scenario.label}
                </span>
                <Icon name="chevron" size={16} />
              </summary>
              <KitChecklist scenario={scenario} entries={scenario.kit} />
              <SourceLinks identifiers={scenario.sources} compact />
            </details>
          ))}
        </div>
      )}
    </details>
  );
}

/** Подводит результат и позволяет повторить вопросы с объяснениями. */
function QuizResult({
  questions,
  answers,
  headingId,
  restart,
}: {
  questions: Question[];
  answers: number[][];
  headingId: string;
  restart: () => void;
}) {
  const score = questions.filter((question, index) =>
    sameSelection(answers[index], question.correct),
  ).length;
  return (
    <div className="quiz-result">
      <div className="result-icon">
        <Icon name={score === questions.length ? "shield" : "book"} size={32} />
      </div>
      <h3 id={headingId} tabIndex={-1}>
        {score === questions.length
          ? "Отлично! Вы разобрались в аптечках."
          : "Хорошее начало. Продолжим учиться!"}
      </h3>
      <p className="score">
        <strong>{score}</strong> из {questions.length} правильных ответов
      </p>
      <p className="muted">
        {score === questions.length
          ? "Теперь проверьте свой настоящий набор — маленький шаг к большей уверенности."
          : "Вернитесь к объяснениям ниже и попробуйте ещё раз."}
      </p>
      <details className="answer-review">
        <summary>
          Разобрать все ответы
          <Icon name="chevron" size={16} />
        </summary>
        {questions.map((question, index) => (
          <div key={question.title}>
            <strong>
              {index + 1}. {question.title}
            </strong>
            <span
              className={`review-label ${sameSelection(answers[index], question.correct) ? "text-green" : "text-rust"}`}
            >
              {sameSelection(answers[index], question.correct)
                ? "Верно"
                : "Нужно повторить"}
            </span>
            <p>
              {question.correct.length > 1
                ? "Правильные ответы:"
                : "Правильный ответ:"}{" "}
              {question.correct
                .map((value) => question.options[value])
                .join("; ")}
              .
            </p>
            <p className="muted">{question.explanation}</p>
            <QuestionReference question={question} />
            <SourceLinks identifiers={question.sources} compact />
          </div>
        ))}
      </details>
      <button className="button primary" onClick={restart}>
        <Icon name="rotate" size={17} />
        Попробовать ещё раз
      </button>
    </div>
  );
}
