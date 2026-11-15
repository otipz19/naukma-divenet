import { Figure } from '../lib.mjs';

const f = new Figure('state-post', 'stm Життєвий цикл допису', { width: 1000, height: 480 });
const state = (name, description) => `<b>${name}</b><hr size="1">${description}`;

f.node('start', 'initial', 485, 50, 30, 30);
f.node('choice', 'choice', 475, 120, 50, 50);
f.node('draft', 'state', 90, 240, 210, 110, state('DRAFT', 'чернетка;<br>видно лише автору'));
f.node('published', 'state', 700, 240, 210, 110, state('PUBLISHED', 'опубліковано;<br>видно всім у стрічках'));
f.node('end', 'final', 486, 416, 28, 28);

f.edge('start', 'choice', 'transition', ['b'], ['t'], { label: 'create(дані)', labelOffset: [46, -4] });
f.edge('choice', 'draft', 'transition', ['l'], ['t'], {
  via: [[195, 145]],
  label: '[status = DRAFT, заголовок є]',
  labelOffset: [0, -12],
});
f.edge('choice', 'published', 'transition', ['r'], ['t'], {
  via: [[805, 145]],
  label: '[status = PUBLISHED, заголовок і текст є]<br>/ publishedAt = зараз, подія PostPublished',
  labelOffset: [0, -20],
});
f.edge('draft', 'published', 'transition', ['r', 268], ['l', 268], {
  label: 'update(status = PUBLISHED) [текст є]<br>/ подія PostPublished',
  labelOffset: [0, -20],
});
f.edge('published', 'draft', 'transition', ['l', 325], ['r', 325], {
  label: 'update(status = DRAFT)',
  labelOffset: [0, 12],
});
f.edge('draft', 'end', 'transition', ['b'], ['l'], {
  via: [[195, 430]],
  label: 'delete() [автор]',
  labelOffset: [0, -11],
});
f.edge('published', 'end', 'transition', ['b'], ['r'], {
  via: [[805, 430]],
  label: 'delete() [автор]',
  labelOffset: [0, -11],
});

export default f;
