import { Figure } from '../lib.mjs';

const f = new Figure('state-site', 'stm Життєвий цикл дайв-сайту, поданого користувачем', { width: 1000, height: 330 });

const state = (name, description) => `<b>${name}</b><hr size="1">${description}`;

f.node('start', 'initial', 485, 55, 30, 30);
f.node('pending', 'state', 390, 170, 220, 110, state('PENDING', 'на модерації;<br>видно лише автору й адміністратору'));
f.node('approved', 'state', 30, 170, 170, 110, state('APPROVED', 'опубліковано;<br>видно всім на мапі'));
f.node('rejected', 'state', 800, 170, 170, 110, state('REJECTED', 'відхилено з причиною;<br>видно лише автору й адміністратору'));

f.edge('start', 'pending', 'transition', ['b'], ['t'], {
  label: 'подати заявку [дані коректні]',
  labelOffset: [100, 0],
});
f.edge('pending', 'approved', 'transition', ['l', 225], ['r', 225], {
  label: 'approve() [роль ADMIN]<br>/ подія SiteApproved',
  labelOffset: [0, -24],
});
f.edge('pending', 'rejected', 'transition', ['r', 225], ['l', 225], {
  label: 'reject(reason)<br>[роль ADMIN,<br>reason 1–500 символів]',
  labelOffset: [0, -32],
});

export default f;
