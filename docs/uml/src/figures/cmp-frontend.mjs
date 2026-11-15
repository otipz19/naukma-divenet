import { Figure } from '../lib.mjs';

const f = new Figure('cmp-frontend', 'cmp Структура застосунку в браузері', { width: 980, height: 690 });
const cmp = (name, detail) => `«component»<br><b>${name}</b><br>${detail}`;

f.node('app', 'component', 330, 60, 320, 75, cmp('app', 'маршрутизатор, макет, тема, клієнт запитів'));
f.node('features', 'boundary', 30, 190, 920, 175, '«component» features: функціональні модулі');
const features = [
  ['site', 'мапа, модерація'],
  ['review', 'відгуки'],
  ['warning', 'попередження'],
  ['post', 'дописи, стрічка'],
  ['divelog', 'журнал'],
  ['user', 'профіль'],
  ['auth', 'вхід'],
  ['achievement', 'досягнення'],
];
features.forEach(([name, detail], i) => {
  f.node(`f${i}`, 'component', 45 + i * 112, 240, 106, 100, `«component»<br><b>${name}</b><br>${detail}`);
});

f.node('i18n', 'component', 30, 435, 250, 75, cmp('i18n', 'локалі en та uk'));
f.node('components', 'component', 365, 435, 250, 75, cmp('components', 'спільні елементи інтерфейсу'));
f.node('api', 'component', 700, 435, 250, 75, cmp('api', 'типізований клієнт, сесія'));
f.node('restBall', 'ballRight', 815, 570, 20, 20, 'REST API /api/v1');
f.node(
  'note',
  'note',
  30,
  570,
  585,
  90,
  'Не показано взаємні посилання між модулями features: одні сторінки вбудовують компоненти інших (наприклад, сторінка сайту показує відгуки та попередження). Переклади модулі отримують через бібліотеку react-i18next.',
);

f.edge('app', 'features', 'dependency', ['b'], ['t', 490]);
f.edge('features', 'i18n', 'dependency', ['b', 155], ['t', 155]);
f.edge('features', 'components', 'dependency', ['b', 490], ['t', 490]);
f.edge('features', 'api', 'dependency', ['b', 825], ['t', 825]);
f.edge('components', 'i18n', 'dependency', ['l'], ['r']);
f.edge('components', 'api', 'dependency', ['r'], ['l']);
f.edge('api', 'restBall', 'dependency', ['b', 825], ['t', 825]);

export default f;
