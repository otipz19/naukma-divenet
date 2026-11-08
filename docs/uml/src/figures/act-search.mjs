import { Figure } from '../lib.mjs';

const f = new Figure('act-search', 'act Пошук і фільтрація дайв-сайтів', { width: 1000, height: 660 });

const [user, spa, spaSide, api] = [150, 390, 610, 860];
f.lane('laneUser', 30, 240, 'Користувач');
f.lane('laneSpa', 270, 460, 'Застосунок у браузері (SPA)');
f.lane('laneApi', 730, 250, 'Сервер (REST API)');

f.start('start', user, 100);
f.act('open', user, 165, 'Відкрити сторінку мапи');
f.act('read', spa, 165, 'Зчитати пошук, фільтри й сортування з URL', 200);
f.act('change', user, 265, 'Змінити пошук, фільтри або сортування');
f.act('query', spa, 265, 'Записати критерії в URL, додати коди регіонів і країн для мови інтерфейсу', 220, 70);
f.act('filter', api, 265, 'Відібрати затверджені сайти за всіма критеріями', 200, 70);
f.act('sort', api, 370, 'Відсортувати за рейтингом або назвою', 200);
f.dec('empty', spaSide, 370);
f.act('none', spa, 370, 'Показати повідомлення «нічого не знайдено»', 200);
f.act('show', spaSide, 470, 'Оновити маркери, список карток і кількість збігів', 210, 70);
f.act('view', user, 470, 'Переглянути результат');
f.dec('again', user, 555);
f.end('end', user, 620);

f.edge('start', 'open', 'transition', ['b'], ['t']);
f.edge('open', 'read', 'transition', ['r'], ['l']);
f.edge('read', 'query', 'transition', ['b'], ['t']);
f.edge('change', 'query', 'transition', ['r'], ['l']);
f.edge('query', 'filter', 'transition', ['r'], ['l']);
f.edge('filter', 'sort', 'transition', ['b'], ['t']);
f.edge('sort', 'empty', 'transition', ['l'], ['r']);
f.edge('empty', 'none', 'transition', ['l'], ['r'], { label: '[сайтів немає]', labelOffset: [0, -11] });
f.edge('empty', 'show', 'transition', ['b'], ['t'], { label: '[сайти є]', labelOffset: [34, 0] });
f.edge('none', 'view', 'transition', ['l'], ['t'], { via: [[user, 370]] });
f.edge('show', 'view', 'transition', ['l'], ['r']);
f.edge('view', 'again', 'transition', ['b'], ['t']);
f.edge('again', 'change', 'transition', ['l'], ['l'], {
  via: [
    [45, 555],
    [45, 265],
  ],
  label: '[уточнити]',
  labelOffset: [8, 130],
});
f.edge('again', 'end', 'transition', ['b'], ['t'], { label: '[достатньо]', labelOffset: [42, -2] });

export default f;
