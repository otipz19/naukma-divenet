import { Figure } from '../lib.mjs';

const f = new Figure('act-certificate', 'act Заявлення та перевірка сертифіката', { width: 1000, height: 870 });

const [diver, system, admin] = [175, 490, 825];
f.lane('laneDiver', 30, 290, 'Дайвер');
f.lane('laneSystem', 320, 340, 'Система');
f.lane('laneAdmin', 660, 310, 'Адміністратор');

f.start('start', diver, 100);
f.act('fill', diver, 165, 'Вказати агентство, рівень, номер і, за бажанням, фото', 210, 62);
f.act('check', system, 165, 'Перевірити дані сертифіката');
f.dec('valid', system, 260);
f.act('fix', diver, 260, 'Виправити помилки в полях');
f.act('save', system, 355, 'Зберегти сертифікат зі статусом PENDING', 210);
f.act('queue', admin, 355, 'Відкрити вкладку сертифікатів', 200);
f.act('inspect', admin, 450, 'Перевірити номер і фото', 200);
f.dec('decide', admin, 545);
f.act('verify', system, 545, 'Встановити статус VERIFIED', 210);
f.act('badge', diver, 545, 'Отримати значок підтвердження', 200);
f.end('end1', diver, 610);
f.act('reason', admin, 650, 'Вказати причину відхилення', 200);
f.act('reject', system, 700, 'Встановити статус REJECTED з причиною', 210);
f.act('told', diver, 700, 'Побачити причину відхилення', 200);
f.dec('retry', diver, 790);
f.end('end2', 275, 790);

f.edge('start', 'fill', 'transition', ['b'], ['t']);
f.edge('fill', 'check', 'transition', ['r'], ['l']);
f.edge('check', 'valid', 'transition', ['b'], ['t']);
f.edge('valid', 'fix', 'transition', ['l'], ['r'], { label: '[дані некоректні]', labelOffset: [40, -11] });
f.edge('fix', 'fill', 'transition', ['t'], ['b']);
f.edge('valid', 'save', 'transition', ['b'], ['t'], { label: '[дані коректні]', labelOffset: [52, 0] });
f.edge('save', 'queue', 'transition', ['r'], ['l']);
f.edge('queue', 'inspect', 'transition', ['b'], ['t']);
f.edge('inspect', 'decide', 'transition', ['b'], ['t']);
f.edge('decide', 'verify', 'transition', ['l'], ['r'], { label: '[підтвердити]', labelOffset: [30, -11] });
f.edge('verify', 'badge', 'transition', ['l'], ['r']);
f.edge('badge', 'end1', 'transition', ['b'], ['t']);
f.edge('decide', 'reason', 'transition', ['b'], ['t'], { label: '[відхилити]', labelOffset: [40, 0] });
f.edge('reason', 'reject', 'transition', ['b'], ['r'], { via: [[admin, 700]] });
f.edge('reject', 'told', 'transition', ['l'], ['r']);
f.edge('told', 'retry', 'transition', ['b'], ['t']);
f.edge('retry', 'fill', 'transition', ['l'], ['l'], {
  via: [
    [48, 790],
    [48, 165],
  ],
  label: '[виправити]',
  labelOffset: [44, 300],
});
f.edge('retry', 'end2', 'transition', ['r'], ['l'], { label: '[ні]', labelOffset: [0, -11] });

export default f;
