import { useEffect, useRef, useState } from "react";
import { items, itemStatus, scenarios, sources, statusLabels } from "../data";
import type { KitEntry, KitItem, Scenario } from "../data";
import { Icon } from "./Icon";
import { SourceLinks } from "./SourceLinks";

/** Показывает состав набора и открывает подробную карточку при выборе предмета. */
export function KitChecklist({
  scenario,
  entries,
}: {
  scenario: Scenario;
  entries: KitEntry[];
}) {
  const [detail, setDetail] = useState<KitEntry | null>(null);
  return (
    <div className="kit-checklist">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">ЧТО ВНУТРИ</span>
          <h3>
            {scenario.normative
              ? "Обязательный состав"
              : "Ваш рекомендательный набор"}
          </h3>
        </div>
      </div>
      <p className="muted small">
        {scenario.normative
          ? "Указаны минимальные количества и размеры изделий. Нажмите на предмет, чтобы узнать назначение, условия хранения и срок годности."
          : "Единого обязательного перечня нет. Это учебная подборка: состав и количество адаптируют под ваши потребности. Условия хранения и сроки годности — в карточках предметов."}
      </p>
      {scenario.normative && (
        <p className="muted small">
          Показан состав по требованиям, действующим с 1 сентября 2024 года.
          Аптечки, произведённые или укомплектованные ранее, могут применяться
          до истечения срока годности изделий, но не позднее 1 сентября 2027
          года.
        </p>
      )}
      <div className="item-grid">
        {entries.map((entry) => (
          <button
            type="button"
            className="item-row"
            key={entry.id}
            aria-label={`Подробнее: ${items[entry.id].name}`}
            aria-haspopup="dialog"
            onClick={() => setDetail(entry)}
          >
            <span className="item-symbol">
              <img
                src={items[entry.id].image}
                alt=""
                width={100}
                height={100}
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="item-copy">
              <strong>{items[entry.id].name}</strong>
              {entry.detail && (
                <span className="item-detail">{entry.detail}</span>
              )}
              {entry.quantity && (
                <span className="quantity">{entry.quantity}</span>
              )}
              <span className={`status ${itemStatus(scenario, entry)}`}>
                {statusLabels[itemStatus(scenario, entry)]}
              </span>
            </span>
          </button>
        ))}
      </div>
      {detail && (
        <ItemDialog
          entry={detail}
          scenario={scenario}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

/** Показывает назначение, хранение, срок годности и статус предмета в выбранном сценарии. */
function ItemDialog({
  entry,
  scenario,
  onClose,
}: {
  entry: KitEntry;
  scenario: Scenario;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const item: KitItem = items[entry.id];
  const usedIn = scenarios.filter((candidate) =>
    candidate.kit.some((value) => value.id === entry.id),
  );
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function closeDialog() {
    // Убираем карточку сразу, чтобы запоздалое событие close не мешало повторному открытию.
    dialog.current?.close();
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="item-dialog"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      aria-labelledby="item-dialog-heading"
    >
      <button
        autoFocus
        className="icon-button dialog-close"
        aria-label="Закрыть карточку"
        onClick={closeDialog}
      >
        <Icon name="close" />
      </button>
      <div className="dialog-content">
        <span className="dialog-symbol">
          <img
            src={item.image}
            alt={item.name}
            width={240}
            height={240}
            decoding="async"
          />
        </span>
        <span className={`status ${itemStatus(scenario, entry)}`}>
          {statusLabels[itemStatus(scenario, entry)]}
        </span>
        <h2 id="item-dialog-heading">{item.name}</h2>
        <p>{item.purpose}</p>
        {entry.quantity && (
          <p className="dialog-quantity">
            {scenario.normative ? "Минимум" : "Запас"}:{" "}
            <strong>{entry.quantity}</strong>
            {entry.detail && <span>{entry.detail}</span>}
          </p>
        )}
        <div className="notice">
          <Icon name="info" />
          <p>{item.caution}</p>
        </div>
        <div className="item-care">
          <section aria-labelledby="item-storage-heading">
            <h3 id="item-storage-heading">
              <Icon name="shield" size={17} /> Условия хранения
            </h3>
            <p>{item.care.storage}</p>
          </section>
          <section aria-labelledby="item-shelf-life-heading">
            <h3 id="item-shelf-life-heading">
              <Icon name="clock" size={17} /> Срок годности
            </h3>
            <p>{item.care.shelfLife}</p>
          </section>
          <p className="small muted">
            Точные температуры, сроки и правила после вскрытия сверяйте с
            упаковкой и инструкцией вашего изделия.
          </p>
          {item.care.source && (
            <SourceLinks identifiers={[item.care.source]} compact />
          )}
        </div>
        <h3>В каких сценариях встречается</h3>
        <div className="scenario-tags">
          {usedIn.map((value) => (
            <span key={value.id}>
              <Icon name={value.icon} size={14} />
              {value.label}
            </span>
          ))}
        </div>
        <p className="small muted">
          Статус зависит от сценария. Индивидуальные препараты подбираются с
          учётом рекомендаций врача.
        </p>
        <a
          className="source-detail"
          href={sources[scenario.regulation ?? item.source].url}
          target="_blank"
          rel="noreferrer"
        >
          Подробнее об источнике
          <Icon name="external" size={15} />
        </a>
        <SourceLinks
          identifiers={[scenario.regulation ?? item.source]}
          compact
        />
      </div>
    </dialog>
  );
}
