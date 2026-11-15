import { Figure } from '../lib.mjs';

const f = new Figure('act-post', 'act Написання та публікація допису', { width: 1000, height: 760 });

const [author, editor, api] = [165, 490, 825];
f.lane('laneAuthor', 30, 290, 'Автор');
f.lane('laneEditor', 320, 340, 'Редактор у браузері (SPA)');
f.lane('laneApi', 660, 310, 'Сервер (REST API)');

f.start('start', author, 100);
f.act('write', author, 165, 'Написати заголовок і текст, додати медіа, регіон і сайт', 210, 62);
f.act('choose', author, 265, 'Обрати: зберегти чернетку чи опублікувати', 210, 62);
f.act('check', editor, 265, 'Перевірити форму: заголовок завжди, текст для публікації', 230, 62);
f.dec('valid', editor, 365);
f.act('fix', author, 365, 'Виправити помилки');
f.act('save', api, 365, 'Прив’язати медіа й зберегти допис', 210);
f.dec('status', api, 460);
f.act('openDraft', editor, 460, 'Відкрити чернетку в редакторі', 210);
f.act('later', author, 460, 'Продовжити редагування пізніше', 200);
f.end('end1', author, 530);
f.act('publish', api, 555, 'Встановити час першої публікації, надіслати подію PostPublished', 230, 62);
f.act('award', api, 650, 'Оцінити досягнення автора', 210);
f.act('openPost', editor, 650, 'Відкрити сторінку допису', 210);
f.act('read', author + 12, 650, 'Побачити опублікований допис', 180);
f.end('end2', 56, 650);

f.edge('start', 'write', 'transition', ['b'], ['t']);
f.edge('write', 'choose', 'transition', ['b'], ['t']);
f.edge('choose', 'check', 'transition', ['r'], ['l']);
f.edge('check', 'valid', 'transition', ['b'], ['t']);
f.edge('valid', 'fix', 'transition', ['l'], ['r'], { label: '[є помилки]', labelOffset: [0, -11] });
f.edge('fix', 'choose', 'transition', ['t'], ['b']);
f.edge('valid', 'save', 'transition', ['r'], ['l'], { label: '[форма коректна]', labelOffset: [-22, -11] });
f.edge('save', 'status', 'transition', ['b'], ['t']);
f.edge('status', 'openDraft', 'transition', ['l'], ['r'], { label: '[DRAFT]', labelOffset: [0, -11] });
f.edge('openDraft', 'later', 'transition', ['l'], ['r']);
f.edge('later', 'end1', 'transition', ['b'], ['t']);
f.edge('status', 'publish', 'transition', ['b'], ['t'], { label: '[PUBLISHED]', labelOffset: [46, 0] });
f.edge('publish', 'award', 'transition', ['b'], ['t']);
f.edge('award', 'openPost', 'transition', ['l'], ['r']);
f.edge('openPost', 'read', 'transition', ['l'], ['r']);
f.edge('read', 'end2', 'transition', ['l'], ['r']);

export default f;
