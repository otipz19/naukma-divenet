import { Sequence } from '../sequence.mjs';

const s = new Sequence(
  'seq-dive-achievement',
  'sd Запис занурення та нарахування досягнень',
  [
    ['spa', ':SPA'],
    ['ctrl', ':DiveLog<br>Controller'],
    ['svc', ':DiveLog<br>Service'],
    ['repo', ':DiveLogEntry<br>Repository'],
    ['listener', ':Achievement<br>Listener'],
    ['ach', ':Achievement<br>Service'],
    ['awards', ':UserAchievement<br>Repository'],
  ],
  { pitch: 142 },
);

s.open('spa');
s.call('spa', 'ctrl', 'POST /dive-log');
s.call('ctrl', 'svc', 'create(userId,<br>content)');
s.call('svc', 'repo', 'save(entry)');
s.ret('repo', 'svc');
s.self('svc', 'publishEvent(<br>DiveLogged)');
s.self('svc', 'commit<br>транзакції');
s.call('svc', 'listener', 'on(DiveLogged)<br>після commit');
s.call('listener', 'ach', 'evaluate(userId)');
s.self('ach', 'обчислити<br>показники');
s.begin('loop', 'ach', 'awards', 'ціль досягнення виконано');
s.call('ach', 'awards', 'award(userId,<br>code, now)');
s.ret('awards', 'ach');
s.finish();
s.ret('ach', 'listener');
s.ret('listener', 'svc');
s.ret('svc', 'ctrl', 'EntryView');
s.ret('ctrl', 'spa', '201 запис');
s.note(
  30,
  760,
  42,
  'Нарахування виконується в окремій транзакції (REQUIRES_NEW): збій у ньому не скасовує вже збережене занурення. Так само подіями PostPublished і SiteApproved нараховуються досягнення за дописи й схвалені сайти.',
);

export default s.done();
