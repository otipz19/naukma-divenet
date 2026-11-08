import { Figure } from '../lib.mjs';

const f = new Figure('state-media', 'stm Життєвий цикл завантаженого файлу', { width: 900, height: 400 });
const state = (name, description) => `<b>${name}</b><hr size="1">${description}`;

f.node('start', 'initial', 35, 135, 30, 30);
f.node('unattached', 'state', 215, 100, 200, 100, state('UNATTACHED', 'завантажено, але ще<br>не використано (attachedAt = null)'));
f.node('attached', 'state', 660, 100, 200, 100, state('ATTACHED', 'прив’язано до відгуку, допису,<br>профілю чи сертифіката'));
f.node('end', 'final', 523, 311, 28, 28);

f.edge('start', 'unattached', 'transition', ['r'], ['l'], {
  label: 'upload()<br>[тип і розмір коректні]',
  labelOffset: [0, -20],
});
f.edge('unattached', 'attached', 'transition', ['r'], ['l'], {
  label: 'attach(ids)<br>[файл власний, тип підходить]',
  labelOffset: [0, -20],
});
f.edge('unattached', 'end', 'transition', ['b'], ['l'], {
  via: [[315, 325]],
  label: 'after(24 год) / MediaCleanup',
  labelOffset: [0, -11],
});
f.edge('attached', 'end', 'transition', ['b'], ['r'], {
  via: [[760, 325]],
  label: 'release(ids)',
  labelOffset: [0, -11],
});

export default f;
