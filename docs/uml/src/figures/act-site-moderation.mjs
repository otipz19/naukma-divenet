import { Figure } from '../lib.mjs';

const f = new Figure('act-site-moderation', 'act Подання та модерація дайв-сайту', { width: 1000, height: 830 });

const [diver, system, admin] = [165, 490, 825];
f.lane('laneDiver', 30, 290, 'Дайвер');
f.lane('laneSystem', 320, 340, 'Система');
f.lane('laneAdmin', 660, 310, 'Адміністратор');

f.start('start', diver, 100);
f.act('fill', diver, 165, 'Заповнити форму заявки на сайт');
f.act('check', system, 165, 'Перевірити дані заявки');
f.dec('valid', system, 260);
f.act('fix', diver, 260, 'Виправити помилки в полях');
f.act('save', system, 355, 'Зберегти сайт зі статусом PENDING', 210);
f.act('queue', admin, 355, 'Відкрити чергу модерації');
f.act('inspect', admin, 450, 'Перевірити дані й розташування сайту', 200);
f.dec('decide', admin, 545);
f.act('approve', system, 545, 'Встановити статус APPROVED', 210);
f.act('award', system, 640, 'Оцінити досягнення автора', 210);
f.act('reason', admin, 640, 'Вказати причину відхилення', 200);
f.act('seen', diver, 640, 'Побачити сайт на мапі');
f.end('end1', diver, 702);
f.act('reject', system, 755, 'Встановити статус REJECTED з причиною', 210);
f.act('told', diver + 12, 755, 'Побачити статус і причину відхилення', 180);
f.end('end2', 56, 755);

f.edge('start', 'fill', 'transition', ['b'], ['t']);
f.edge('fill', 'check', 'transition', ['r'], ['l']);
f.edge('check', 'valid', 'transition', ['b'], ['t']);
f.edge('valid', 'fix', 'transition', ['l'], ['r'], { label: '[дані некоректні]', labelOffset: [40, -11] });
f.edge('fix', 'fill', 'transition', ['t'], ['b']);
f.edge('valid', 'save', 'transition', ['b'], ['t'], { label: '[дані коректні]', labelOffset: [52, 0] });
f.edge('save', 'queue', 'transition', ['r'], ['l']);
f.edge('queue', 'inspect', 'transition', ['b'], ['t']);
f.edge('inspect', 'decide', 'transition', ['b'], ['t']);
f.edge('decide', 'approve', 'transition', ['l'], ['r'], { label: '[схвалити]', labelOffset: [30, -11] });
f.edge('approve', 'award', 'transition', ['b'], ['t']);
f.edge('award', 'seen', 'transition', ['l'], ['r']);
f.edge('seen', 'end1', 'transition', ['b'], ['t']);
f.edge('decide', 'reason', 'transition', ['b'], ['t'], { label: '[відхилити]', labelOffset: [40, 0] });
f.edge('reason', 'reject', 'transition', ['b'], ['r'], { via: [[admin, 755]] });
f.edge('reject', 'told', 'transition', ['l'], ['r']);
f.edge('told', 'end2', 'transition', ['l'], ['r']);

export default f;
