import { useState } from "react";
import { scenarios, statusLabels } from "../data";
import { categoryStatus, comparisonCategories } from "../learning";
import { Icon } from "./Icon";
import { SourceLinks } from "./SourceLinks";

/** Сравнивает базовые наборы и при необходимости скрывает общие категории. */
export function Comparison() {
  const [differences, setDifferences] = useState(false);
  const rows = comparisonCategories.filter(
    ([category]) =>
      !differences ||
      !scenarios.every((scenario) => categoryStatus(scenario, category)),
  );
  return (
    <section id="comparison" className="comparison section-anchor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ПОХОЖИ, НО НЕ ОДИНАКОВЫ</span>
          <h2>Один взгляд — пять аптечек</h2>
          <p className="muted">Что общее, а что зависит от вашей ситуации.</p>
        </div>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={differences}
            onChange={(event) => setDifferences(event.target.checked)}
          />
          Различия в наличии
        </label>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Сравнение пяти аптечек, таблица прокручивается по горизонтали"
      >
        <table>
          <caption className="visually-hidden">
            Обязательные, рекомендательные и индивидуальные компоненты пяти
            аптечек
          </caption>
          <thead>
            <tr>
              <th scope="col">Компонент</th>
              {scenarios.map((scenario) => (
                <th scope="col" key={scenario.id}>
                  <Icon name={scenario.icon} size={21} />
                  <span>{scenario.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([category, label]) => (
              <tr key={category}>
                <th scope="row">{label}</th>
                {scenarios.map((scenario) => {
                  const status = categoryStatus(scenario, category);
                  return (
                    <td key={scenario.id}>
                      {status ? (
                        <span className={`matrix-status ${status}`}>
                          <span aria-hidden="true">
                            {status === "required"
                              ? "●"
                              : status === "recommended"
                                ? "○"
                                : "◇"}
                          </span>
                          <span className="visually-hidden">
                            {statusLabels[status]}
                          </span>
                        </span>
                      ) : (
                        <span className="matrix-empty">
                          <span aria-hidden="true">—</span>
                          <span className="visually-hidden">
                            Не включено в базовый набор
                          </span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="matrix-legend">
        <span>
          <b className="required">●</b>Обязательное
        </span>
        <span>
          <b className="recommended">○</b>Рекомендуется
        </span>
        <span>
          <b className="personal">◇</b>Индивидуально
        </span>
        <span>
          <b className="muted">—</b>Не в базовом наборе
        </span>
      </div>
      <p className="small muted comparison-note">
        Сравниваются базовые наборы, до настройки под поездку. «Не в базовом
        наборе» не означает запрет. Поддерживающий эластичный бинт показан
        отдельно от разрешённых приказом фиксирующих бинтов. Точные количества и
        размеры — в сценариях.
      </p>
      <SourceLinks
        identifiers={["S02", "S03", "S05", "S06", "S07", "S08"]}
        compact
      />
    </section>
  );
}
