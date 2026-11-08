import { Figure } from '../lib.mjs';

const f = new Figure('state-certificate', 'stm Життєвий цикл сертифіката дайвера', { width: 1000, height: 450 });
const state = (name, description) => `<b>${name}</b><hr size="1">${description}`;

f.node('start', 'initial', 485, 55, 30, 30);
f.node('pending', 'state', 390, 150, 220, 110, state('PENDING', 'очікує перевірки адміністратором'));
f.node('verified', 'state', 30, 150, 170, 110, state('VERIFIED', 'підтверджено;<br>показано значок'));
f.node('rejected', 'state', 800, 150, 170, 110, state('REJECTED', 'відхилено з причиною;<br>видно власнику й адміністратору'));
f.node('end', 'final', 486, 375, 28, 28);

f.edge('start', 'pending', 'transition', ['b'], ['t'], { label: 'declare(дані) [дані коректні]', labelOffset: [98, 0] });
f.edge('pending', 'verified', 'transition', ['l', 180], ['r', 180], {
  label: 'verify() [роль ADMIN]',
  labelOffset: [0, -12],
});
f.edge('verified', 'pending', 'transition', ['r', 232], ['l', 232], {
  label: 'update(дані)',
  labelOffset: [0, 12],
});
f.edge('pending', 'rejected', 'transition', ['r', 180], ['l', 180], {
  label: 'reject(reason) [роль ADMIN]',
  labelOffset: [0, -12],
});
f.edge('rejected', 'pending', 'transition', ['l', 232], ['r', 232], {
  label: 'update(дані)',
  labelOffset: [0, 12],
});
f.edge('pending', 'end', 'transition', ['b'], ['t'], { label: 'delete() [власник]', labelOffset: [62, 0] });
f.edge('verified', 'end', 'transition', ['b'], ['l'], {
  via: [[115, 389]],
  label: 'delete() [власник]',
  labelOffset: [0, -11],
});
f.edge('rejected', 'end', 'transition', ['b'], ['r'], {
  via: [[885, 389]],
  label: 'delete() [власник]',
  labelOffset: [0, -11],
});

export default f;
