import { Sequence } from '../sequence.mjs';

const s = new Sequence('seq-review', 'sd Написання відгуку з фото та оновлення рейтингу сайту', [
  ['spa', ':SPA'],
  ['ctrl', ':ReviewController'],
  ['svc', ':ReviewService'],
  ['cat', ':SiteCatalogService'],
  ['media', ':MediaService'],
  ['repo', ':ReviewRepository'],
]);

s.open('spa');
s.call('spa', 'ctrl', 'POST /sites/{id}/reviews<br>(оцінка, текст, медіа)');
s.call('ctrl', 'svc', 'create(siteId,<br>authorId, content)');
s.call('svc', 'cat', 'lockForReview(siteId)');
s.ret('cat', 'svc', 'Site');
s.call('svc', 'repo', 'existsBySite_IdAndAuthor_Id()');
s.ret('repo', 'svc', 'так або ні');
s.begin('alt', 'spa', 'repo', 'відгук цього автора вже існує');
s.ret('svc', 'ctrl', 'ReviewAlready<br>ExistsException');
s.ret('ctrl', 'spa', '409 ProblemDetail');
s.otherwise('відгуку ще немає');
s.call('svc', 'media', 'attach(photoIds), attachVideos(videoIds)');
s.ret('media', 'svc');
s.call('svc', 'repo', 'saveAndFlush(review)');
s.ret('repo', 'svc');
s.call('svc', 'repo', 'aggregates(siteId)');
s.ret('repo', 'svc', 'середні значення, кількість');
s.call('svc', 'cat', 'updateReview<br>Aggregates(...)');
s.ret('cat', 'svc');
s.ret('svc', 'ctrl', 'ReviewView');
s.ret('ctrl', 'spa', '201 відгук');
s.finish();
s.note(
  30,
  660,
  42,
  'Усі кроки ReviewService.create виконуються в одній транзакції, тож відгук, прив’язка медіа й рейтинг сайту зберігаються разом.',
);

export default s.done();
