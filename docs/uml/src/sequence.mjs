import { Figure } from './lib.mjs';

const BAR = 6;
const STEP = 48;

const lineCount = (label) => label.split('<br>').length;

/** Lays out a sequence diagram from top to bottom as its messages are added. */
export class Sequence {
  constructor(name, heading, participants, { pitch = 165, step = STEP } = {}) {
    this.figure = new Figure(name, heading, { width: 40 + pitch * participants.length, height: 0 });
    this.participants = participants;
    this.pitch = pitch;
    this.step = step;
    this.index = new Map(participants.map(([id], i) => [id, i]));
    this.y = 125;
    this.depth = new Map(participants.map(([id]) => [id, 0]));
    this.opened = new Map();
    this.bars = [];
    this.fragments = [];
    this.stack = [];
    this.notes = [];
  }

  cx(id) {
    return 20 + this.pitch / 2 + this.index.get(id) * this.pitch;
  }

  open(id) {
    if (this.depth.get(id) === 0) this.opened.set(id, this.y);
    this.depth.set(id, this.depth.get(id) + 1);
  }

  close(id) {
    this.depth.set(id, this.depth.get(id) - 1);
    if (this.depth.get(id) === 0) this.bars.push([id, this.opened.get(id), this.y]);
  }

  arrow(from, to, kind, label) {
    const right = this.index.get(to) > this.index.get(from);
    const sign = right ? 1 : -1;
    this.figure.edge(from, to, kind, ['p', this.cx(from) + sign * BAR, this.y], ['p', this.cx(to) - sign * BAR, this.y], {
      label,
      labelOffset: [0, lineCount(label) > 1 ? -17 : -10],
    });
  }

  /** A synchronous call: starts or extends the activation of the target. */
  call(from, to, label) {
    this.y += this.step;
    this.open(to);
    this.arrow(from, to, 'message', label);
  }

  /** A reply that ends one level of activation of its sender. */
  ret(from, to, label = '') {
    this.y += label && lineCount(label) > 1 ? this.step : Math.max(this.step - 8, 34);
    this.arrow(from, to, 'reply', label);
    this.close(from);
  }

  /** A message to itself, drawn as a small right-angled loop with the text at its right. */
  self(id, label) {
    this.y += this.step - 14;
    const x = this.cx(id) + BAR;
    const widest = Math.max(...label.split('<br>').map((line) => line.length));
    this.figure.edge(id, id, 'message', ['p', x, this.y], ['p', x, this.y + 20], {
      via: [
        [x + 26, this.y],
        [x + 26, this.y + 20],
      ],
      label,
      labelOffset: [30 + widest * 3.1, 0],
    });
    this.y += 20;
  }

  /** Opens a combined fragment (alt, loop, opt) over the given participants. */
  begin(kind, first, last, guard) {
    this.y += 40;
    const snapshot = new Map(this.depth);
    const opened = new Map(this.opened);
    this.stack.push({ kind, first, last, top: this.y - 22, snapshot, opened, branches: [{ y: this.y - 22, guard, first: true }] });
    this.y += 6;
  }

  /** Starts the next branch: the activations are back to how the fragment found them. */
  otherwise(guard) {
    const top = this.stack.at(-1);
    this.y += 22;
    for (const [id, depth] of top.snapshot) {
      if (this.depth.get(id) < depth) this.opened.set(id, this.y - 4);
      if (this.depth.get(id) > depth) this.bars.push([id, this.opened.get(id), this.y - 8]);
      this.depth.set(id, depth);
    }
    top.branches.push({ y: this.y, guard, first: false });
    this.y += 14;
  }

  finish() {
    const top = this.stack.pop();
    this.y += 24;
    this.fragments.push({ ...top, bottom: this.y });
  }

  note(x, width, height, text) {
    for (const [id, depth] of this.depth) {
      if (depth > 0) {
        this.bars.push([id, this.opened.get(id), this.y + 6]);
        this.depth.set(id, 0);
      }
    }
    this.y += 20;
    this.notes.push({ x, y: this.y, width, height, text });
    this.y += height;
  }

  done() {
    for (const [id, depth] of this.depth) {
      if (depth > 0) this.bars.push([id, this.opened.get(id), this.y + 10]);
    }
    const bottom = this.y + 40;
    const f = this.figure;
    f.height = bottom + 20;
    this.participants.forEach(([id, label], i) => {
      f.node(id, 'lifeline', 30 + i * this.pitch, 50, this.pitch - 20, bottom - 50, label);
    });
    this.bars.forEach(([id, from, to], i) => {
      f.node(`bar${i}`, 'activation', this.cx(id) - BAR, from, BAR * 2, Math.max(to - from, 10));
    });
    this.fragments.forEach((frag, i) => {
      const x = this.cx(frag.first) - this.pitch / 2 + 6;
      const width = this.cx(frag.last) + this.pitch / 2 - 6 - x;
      f.node(`frag${i}`, 'fragment', x, frag.top, width, frag.bottom - frag.top, frag.kind);
      frag.branches.forEach((branch, b) => {
        if (!branch.first) f.node(`frag${i}sep${b}`, 'separator', x, branch.y, width, 1);
        const textX = branch.first ? x + 52 : x + 8;
        f.node(`frag${i}guard${b}`, 'text', textX, branch.y + (branch.first ? 2 : 3), width - 60, 18, `[${branch.guard}]`);
      });
    });
    this.notes.forEach((note, i) => {
      f.node(`note${i}`, 'note', note.x, note.y, note.width, note.height, note.text);
    });
    return f;
  }
}
