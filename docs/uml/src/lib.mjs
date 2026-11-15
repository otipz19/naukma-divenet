// Helpers that describe a UML figure with exact coordinates and write it as a draw.io file.
// Edges have explicit routes, so draw.io draws what is written here and adds no curves of its own.

const BASE =
  'html=1;whiteSpace=wrap;fontFamily=Arial;fontSize=12;fontColor=#000000;strokeColor=#000000;fillColor=#FFFFFF;strokeWidth=1;';

export const NODE_STYLES = {
  node: `${BASE}shape=cube;size=12;direction=south;anchorPointDirection=0;verticalAlign=top;align=left;spacingLeft=10;spacingTop=12;spacingRight=14;`,
  artifact: `${BASE}align=center;verticalAlign=middle;`,
  note: `${BASE}shape=note;size=14;align=left;verticalAlign=middle;spacingLeft=8;spacingRight=8;`,
  state: `${BASE}rounded=1;arcSize=18;align=center;verticalAlign=middle;spacing=6;`,
  initial: `${BASE}ellipse;fillColor=#000000;`,
  final: `${BASE}ellipse;shape=endState;fillColor=#000000;`,
  choice: `${BASE}rhombus;`,
  actor: `${BASE}shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;align=center;fillColor=none;`,
  usecase: `${BASE}ellipse;align=center;verticalAlign=middle;spacingLeft=14;spacingRight=14;`,
  boundary: `${BASE}fillColor=none;verticalAlign=top;align=center;fontStyle=1;spacingTop=4;pointerEvents=0;`,
  lane: `${BASE}swimlane;startSize=30;horizontal=1;fontStyle=1;collapsible=0;fillColor=none;pointerEvents=0;`,
  action: `${BASE}rounded=1;arcSize=28;align=center;verticalAlign=middle;spacing=4;`,
  lifeline: `${BASE}shape=umlLifeline;perimeter=lifelinePerimeter;collapsible=0;recursiveResize=0;outlineConnect=0;size=44;`,
  activation: `${BASE}`,
  fragment: `${BASE}shape=umlFrame;width=44;height=22;fillColor=none;pointerEvents=0;align=left;verticalAlign=middle;spacingLeft=4;fontStyle=1;`,
  separator: `${BASE}shape=line;dashed=1;fillColor=none;pointerEvents=0;`,
  text: `${BASE}text;whiteSpace=nowrap;strokeColor=none;fillColor=none;labelBackgroundColor=#FFFFFF;align=left;verticalAlign=middle;spacing=0;pointerEvents=0;`,
  cls: `${BASE}align=left;verticalAlign=top;spacingLeft=6;spacingRight=6;spacingTop=4;`,
  ref: `${BASE}align=center;verticalAlign=middle;`,
  pkg: `${BASE}fillColor=none;verticalAlign=top;align=left;spacingLeft=8;spacingTop=2;fontStyle=1;pointerEvents=0;`,
  component: `${BASE}align=center;verticalAlign=middle;spacing=4;`,
  ballRight: `${BASE}ellipse;whiteSpace=nowrap;labelPosition=right;verticalLabelPosition=middle;align=left;verticalAlign=middle;spacingLeft=4;`,
  ballTop: `${BASE}ellipse;whiteSpace=nowrap;labelPosition=center;verticalLabelPosition=top;align=center;verticalAlign=bottom;`,
};

// Backgrounds and overlays that lines may legitimately pass over.
const BACKDROP_KINDS = new Set(['boundary', 'lane', 'lifeline', 'activation', 'fragment', 'separator', 'text', 'pkg']);

const EDGE_BASE =
  'edgeStyle=none;rounded=0;html=1;fontFamily=Arial;fontSize=12;fontColor=#000000;strokeColor=#000000;strokeWidth=1;labelBackgroundColor=#FFFFFF;exitPerimeter=0;entryPerimeter=0;';

export const EDGE_STYLES = {
  link: `${EDGE_BASE}endArrow=none;`,
  transition: `${EDGE_BASE}endArrow=open;endSize=10;`,
  dependency: `${EDGE_BASE}dashed=1;endArrow=open;endSize=10;`,
  noteLink: `${EDGE_BASE}dashed=1;endArrow=none;`,
  message: `${EDGE_BASE}endArrow=block;endFill=1;endSize=8;`,
  reply: `${EDGE_BASE}dashed=1;endArrow=open;endSize=9;`,
  generalization: `${EDGE_BASE}endArrow=block;endFill=0;endSize=12;`,
  realization: `${EDGE_BASE}dashed=1;endArrow=block;endFill=0;endSize=12;`,
  composition: `${EDGE_BASE}startArrow=diamondThin;startFill=1;startSize=16;endArrow=none;`,
};

const escapeXml = (text) =>
  String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export class Figure {
  constructor(name, heading, { width, height }) {
    Object.assign(this, { name, heading, width, height, nodes: new Map(), edges: [] });
  }

  node(id, kind, x, y, w, h, label = '', parent = null) {
    if (this.nodes.has(id)) throw new Error(`${this.name}: duplicate node ${id}`);
    this.nodes.set(id, { id, kind, x, y, w, h, label, parent });
    return id;
  }

  /**
   * Connects two nodes. `from` and `to` name a side and, optionally, the coordinate along it:
   * ['b', 572] leaves the bottom side at x = 572; ['r'] leaves the middle of the right side.
   * `via` lists the corner points. `labelOffset` moves the label from the middle of the line.
   */
  edge(
    source,
    target,
    kind,
    from,
    to,
    { via = [], label = '', labelOffset = [0, 0], allowDiagonal = false, ends = [] } = {},
  ) {
    this.edges.push({ source, target, kind, from, to, via, label, labelOffset, allowDiagonal, ends });
  }

  // Shorthands for activity diagrams; coordinates are the centre of the shape.
  lane(id, x, w, label) {
    return this.node(id, 'lane', x, 45, w, this.height - 60, label);
  }
  start(id, cx, cy) {
    return this.node(id, 'initial', cx - 13, cy - 13, 26, 26);
  }
  end(id, cx, cy) {
    return this.node(id, 'final', cx - 14, cy - 14, 28, 28);
  }
  act(id, cx, cy, label, w = 180, h = 56) {
    return this.node(id, 'action', cx - w / 2, cy - h / 2, w, h, label);
  }
  dec(id, cx, cy, size = 44) {
    return this.node(id, 'choice', cx - size / 2, cy - size / 2, size, size);
  }

  /** A class box: name, attributes and operations in compartments. Height follows the text. */
  cls(id, x, y, w, name, attrs = [], ops = [], { stereotype = '', minHeight = 0 } = {}) {
    const head = `${stereotype ? `${stereotype}<br>` : ''}<b>${name}</b>`;
    let label = `<div style="text-align:center">${head}</div>`;
    let h = (stereotype ? 40 : 26) + 6;
    for (const part of [attrs, ops]) {
      if (part.length) {
        label += `<hr size="1">${part.join('<br>')}`;
        h += 14 + part.length * 15;
      }
    }
    return this.node(id, 'cls', x, y, w, Math.max(h, minHeight), label);
  }

  anchor(id, [side, along, pointY]) {
    const n = this.nodes.get(id);
    if (!n) throw new Error(`${this.name}: unknown node ${id}`);
    if (side === 'p') return { x: along, y: pointY, fx: (along - n.x) / n.w, fy: (pointY - n.y) / n.h };
    if (side === 't' || side === 'b') {
      const x = along ?? n.x + n.w / 2;
      return { x, y: side === 't' ? n.y : n.y + n.h, fx: (x - n.x) / n.w, fy: side === 't' ? 0 : 1 };
    }
    const y = along ?? n.y + n.h / 2;
    return { x: side === 'l' ? n.x : n.x + n.w, y, fx: side === 'l' ? 0 : 1, fy: (y - n.y) / n.h };
  }

  route(edge) {
    const a = this.anchor(edge.source, edge.from);
    const b = this.anchor(edge.target, edge.to);
    return [[a.x, a.y], ...edge.via, [b.x, b.y]];
  }

  ancestors(id) {
    const found = new Set();
    for (let n = this.nodes.get(id); n?.parent; n = this.nodes.get(n.parent)) found.add(n.parent);
    return found;
  }

  toXml() {
    const tagWidth = Math.ceil(this.heading.length * 6.6) + 24;
    const cells = [
      '<mxCell id="0"/>',
      '<mxCell id="1" parent="0"/>',
      `<mxCell id="frame" value="${escapeXml(this.heading)}" style="${BASE}shape=umlFrame;width=${tagWidth};height=28;fillColor=none;pointerEvents=0;align=left;verticalAlign=middle;spacingLeft=6;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="0" y="0" width="${this.width}" height="${this.height}" as="geometry"/></mxCell>`,
    ];
    for (const n of this.nodes.values()) {
      const p = n.parent ? this.nodes.get(n.parent) : { x: 0, y: 0 };
      const parent = n.parent ?? '1';
      const size = `width="${n.w}" height="${n.h}"`;
      cells.push(
        `<mxCell id="${n.id}" value="${escapeXml(n.label)}" style="${NODE_STYLES[n.kind]}" vertex="1" parent="${parent}"><mxGeometry x="${n.x - p.x}" y="${n.y - p.y}" ${size} as="geometry"/></mxCell>`,
      );
    }
    this.edges.forEach((e, i) => {
      const a = this.anchor(e.source, e.from);
      const b = this.anchor(e.target, e.to);
      const style = `${EDGE_STYLES[e.kind]}exitX=${a.fx};exitY=${a.fy};entryX=${b.fx};entryY=${b.fy};`;
      const points = e.via.length
        ? `<Array as="points">${e.via.map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join('')}</Array>`
        : '';
      const [dx, dy] = e.labelOffset;
      cells.push(
        `<mxCell id="edge${i}" value="${escapeXml(e.label)}" style="${style}" edge="1" parent="1" source="${e.source}" target="${e.target}"><mxGeometry relative="1" as="geometry">${points}<mxPoint x="${dx}" y="${dy}" as="offset"/></mxGeometry></mxCell>`,
      );
      // Multiplicities and roles sit beside the two ends of the line.
      const route = this.route(e);
      const lengths = route.slice(1).map((p, s) => Math.hypot(p[0] - route[s][0], p[1] - route[s][1]));
      const total = lengths.reduce((a, b) => a + b, 0);
      e.ends.forEach((text, end) => {
        if (!text) return;
        const [p, q] = end === 0 ? [route[0], route[1]] : [route.at(-1), route.at(-2)];
        const horizontal = p[1] === q[1];
        const distance = 12 + String(text).length * 3.2;
        const x = end === 0 ? -1 + (2 * distance) / total : 1 - (2 * distance) / total;
        const offset = horizontal ? 'x="0" y="-10"' : `x="${8 + String(text).length * 3.2}" y="0"`;
        cells.push(
          `<mxCell id="edge${i}-end${end}" value="${escapeXml(text)}" style="edgeLabel;html=1;resizable=0;align=center;verticalAlign=middle;fontFamily=Arial;fontSize=11;fontColor=#000000;labelBackgroundColor=none;" vertex="1" connectable="0" parent="edge${i}"><mxGeometry x="${x}" relative="1" as="geometry"><mxPoint ${offset} as="offset"/></mxGeometry></mxCell>`,
        );
      });
    });
    const page = `pageWidth="${this.width + 20}" pageHeight="${this.height + 20}"`;
    const model = `<mxGraphModel dx="1000" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" ${page} math="0" shadow="0"><root>${cells.join('')}</root></mxGraphModel>`;
    return `<mxfile host="divenet-uml"><diagram id="${this.name}" name="${escapeXml(this.heading)}">${model}</diagram></mxfile>\n`;
  }
}

const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
const onSegment = (a, b, p) =>
  cross(a, b, p) === 0 &&
  p[0] >= Math.min(a[0], b[0]) &&
  p[0] <= Math.max(a[0], b[0]) &&
  p[1] >= Math.min(a[1], b[1]) &&
  p[1] <= Math.max(a[1], b[1]);
const sameEnd = (p, q) => p[0] === q[0] && p[1] === q[1];

function segmentsTouch(a, b, c, d) {
  const proper =
    Math.sign(cross(a, b, c)) * Math.sign(cross(a, b, d)) < 0 &&
    Math.sign(cross(c, d, a)) * Math.sign(cross(c, d, b)) < 0;
  return proper || onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
}

/** Does the segment pass through the inside of the rectangle (touching its border does not count)? */
function segmentEntersRect(a, b, n) {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const edges = [
    [-dx, a[0] - n.x],
    [dx, n.x + n.w - a[0]],
    [-dy, a[1] - n.y],
    [dy, n.y + n.h - a[1]],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q <= 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
  }
  return t0 < t1;
}

/** Returns the layout problems of a figure: crossings, slanted lines, lines over boxes, stray boxes. */
export function checkLayout(figure) {
  const problems = [];
  const nodes = [...figure.nodes.values()].filter((n) => !BACKDROP_KINDS.has(n.kind));
  const routes = figure.edges.map((e) => figure.route(e));
  const name = (e) => `${e.source}->${e.target}`;

  for (const n of nodes) {
    const p = n.parent ? figure.nodes.get(n.parent) : { x: 0, y: 0, w: figure.width, h: figure.height };
    if (n.x < p.x || n.y < p.y || n.x + n.w > p.x + p.w || n.y + n.h > p.y + p.h) {
      problems.push(`box ${n.id} sticks out of ${n.parent ?? 'the frame'}`);
    }
  }
  nodes.forEach((a, i) => {
    for (const b of nodes.slice(i + 1)) {
      if (figure.ancestors(a.id).has(b.id) || figure.ancestors(b.id).has(a.id)) continue;
      const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      if (!apart) problems.push(`boxes ${a.id} and ${b.id} overlap`);
    }
  });

  figure.edges.forEach((e) => {
    for (const [id, [side, along]] of [
      [e.source, e.from],
      [e.target, e.to],
    ]) {
      const n = figure.nodes.get(id);
      const [low, high] = side === 't' || side === 'b' ? [n.x, n.x + n.w] : [n.y, n.y + n.h];
      if (side !== 'p' && along !== undefined && (along < low || along > high)) {
        problems.push(`line ${name(e)} ends beside box ${id}, not on it`);
      }
    }
  });

  figure.edges.forEach((e, i) => {
    const route = routes[i];
    const allowed =new Set([e.source, e.target, ...figure.ancestors(e.source), ...figure.ancestors(e.target)]);
    for (let s = 0; s + 1 < route.length; s += 1) {
      const [a, b] = [route[s], route[s + 1]];
      if (!e.allowDiagonal && a[0] !== b[0] && a[1] !== b[1]) problems.push(`line ${name(e)} is slanted`);
      for (const n of nodes) {
        if (!allowed.has(n.id) && segmentEntersRect(a, b, n)) problems.push(`line ${name(e)} runs over box ${n.id}`);
      }
    }
    figure.edges.slice(i + 1).forEach((other, offset) => {
      const otherRoute = routes[i + 1 + offset];
      for (let s = 0; s + 1 < route.length; s += 1) {
        for (let t = 0; t + 1 < otherRoute.length; t += 1) {
          const [a, b, c, d] = [route[s], route[s + 1], otherRoute[t], otherRoute[t + 1]];
          const sharedEnd = [a, b].some((p) => sameEnd(p, c) || sameEnd(p, d));
          if (!sharedEnd && segmentsTouch(a, b, c, d)) problems.push(`lines ${name(e)} and ${name(other)} cross`);
        }
      }
    });
  });
  return problems;
}
