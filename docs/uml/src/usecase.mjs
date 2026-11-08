import { Figure } from './lib.mjs';

const TOP = 90;
const PITCH = 66;
const ROW_H = 54;

/**
 * Draws one actor on the left with its use cases in a column, so that the straight lines
 * fan out without crossing. A row may have a related use case in a second column:
 * { label, include: 'text' } or { label, extend: 'text' }.
 * `extraActors` are drawn below the main one and inherit from the actor above them.
 */
export function useCases(name, heading, actorLabel, rows, { extraActors = [], actorY } = {}) {
  const height = TOP + rows.length * PITCH + 20;
  const f = new Figure(name, heading, { width: 990, height });
  f.node('system', 'boundary', 220, 50, 750, height - 65, 'Система DiveNet');

  const actorCy = actorY ?? TOP + (rows.length * PITCH) / 2 - 20;
  f.node('actor', 'actor', 75, actorCy - 35, 40, 70, actorLabel);

  extraActors.forEach(({ label, y }, i) => {
    const id = `actor${i + 1}`;
    const parent = i === 0 ? 'actor' : `actor${i}`;
    f.node(id, 'actor', 75, y - 35, 40, 70, label);
    const parentNode = f.nodes.get(parent);
    const parentCy = parentNode.y + parentNode.h / 2;
    const offset = 48 - i * 16;
    // The arrow enters a little below the middle, where this actor's own line to its parent leaves.
    const entry = parentCy + 14;
    f.edge(id, parent, 'generalization', ['l'], ['l', entry], { via: [[offset, y], [offset, entry]] });
  });

  rows.forEach((row, i) => {
    const y = TOP + i * PITCH;
    const cy = y + ROW_H / 2;
    const id = `uc${i}`;
    f.node(id, 'usecase', 280, y, 290, ROW_H, row.label);
    f.edge('actor', id, 'link', ['r'], ['l'], { allowDiagonal: true });
    if (row.include) {
      f.node(`${id}x`, 'usecase', 680, y, 270, ROW_H, row.include);
      f.edge(id, `${id}x`, 'dependency', ['r', cy], ['l', cy], { label: '«include»', labelOffset: [0, -11] });
    }
    if (row.extend) {
      f.node(`${id}x`, 'usecase', 680, y, 270, ROW_H, row.extend);
      f.edge(`${id}x`, id, 'dependency', ['l', cy], ['r', cy], { label: '«extend»', labelOffset: [0, -11] });
    }
  });
  return f;
}
