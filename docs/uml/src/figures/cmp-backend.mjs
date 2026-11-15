import { Figure } from '../lib.mjs';

const f = new Figure('cmp-backend', 'cmp Модулі back-end та їхні залежності', { width: 980, height: 640 });
const cmp = (name, detail) => `«component»<br><b>${name}</b><br>${detail}`;
const [c1, c2, c3, c4, c5] = [30, 230, 430, 630, 830];
const W = 120;
const H = 62;

f.node('achievement', 'component', c2, 60, W, H, cmp('achievement', 'досягнення'));
f.node('divelog', 'component', c1, 190, W, H, cmp('divelog', 'журнал занурень'));
f.node('post', 'component', c3, 190, W, H, cmp('post', 'дописи, стрічки'));
f.node('warning', 'component', c1, 310, W, H, cmp('warning', 'попередження'));
f.node('site', 'component', c2, 310, W, H, cmp('site', 'дайв-сайти'));
f.node('geo', 'component', c3, 310, W, H, cmp('geo', 'країни, регіони'));
f.node('review', 'component', c3, 430, W, H, cmp('review', 'відгуки, оцінки'));
f.node('media', 'component', c4, 190, W, 302, cmp('media', 'файли'));
f.node('auth', 'component', c5, 190, W, H, cmp('auth', 'вхід, токени'));
f.node('user', 'component', c5, 430, W, H, cmp('user', 'профілі, сертифікати'));
f.node(
  'note',
  'note',
  30,
  535,
  920,
  80,
  'Для читабельності не показано: залежності від модуля user (їх мають achievement, auth, divelog, media, post, review, site і warning), від shared (допоміжний модуль, ним користуються всі) та модуль demo (демонстраційні дані, залежить від усіх предметних модулів).',
);

f.edge('achievement', 'divelog', 'dependency', ['l'], ['t'], { via: [[c1 + W / 2, 91]] });
f.edge('achievement', 'post', 'dependency', ['r'], ['t'], { via: [[c3 + W / 2, 91]] });
f.edge('achievement', 'site', 'dependency', ['b'], ['t']);
f.edge('divelog', 'site', 'dependency', ['r'], ['t', c2 + 30], { via: [[c2 + 30, 221]] });
f.edge('post', 'site', 'dependency', ['l'], ['t', c2 + 90], { via: [[c2 + 90, 221]] });
f.edge('warning', 'site', 'dependency', ['r'], ['l']);
f.edge('site', 'geo', 'dependency', ['r'], ['l']);
f.edge('post', 'geo', 'dependency', ['b'], ['t']);
f.edge('post', 'media', 'dependency', ['r'], ['l', 221]);
f.edge('review', 'media', 'dependency', ['r'], ['l', 461]);
f.edge('review', 'site', 'dependency', ['l'], ['b'], { via: [[c2 + W / 2, 461]] });
f.edge('user', 'media', 'dependency', ['l'], ['r', 461]);
f.edge('media', 'auth', 'dependency', ['r', 221], ['l']);

export default f;
