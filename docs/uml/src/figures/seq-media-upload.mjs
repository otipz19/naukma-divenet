import { Sequence } from '../sequence.mjs';

const s = new Sequence('seq-media-upload', 'sd Завантаження зображення', [
  ['spa', ':SPA'],
  ['ctrl', ':MediaController'],
  ['svc', ':MediaService'],
  ['img', ':ImageProcessor'],
  ['store', '«interface»<br>:MediaStorage'],
  ['repo', ':MediaRepository'],
]);

s.open('spa');
s.call('spa', 'ctrl', 'POST /media (файл)');
s.call('ctrl', 'svc', 'upload(userId, bytes)');
s.begin('alt', 'spa', 'repo', 'файл більший за 10 МБ');
s.ret('svc', 'ctrl', 'ImageTooLarge');
s.ret('ctrl', 'spa', '413 ProblemDetail');
s.otherwise('розмір допустимий');
s.call('svc', 'img', 'process(bytes)');
s.begin('alt', 'spa', 'repo', 'вміст не є JPEG, PNG або WebP');
s.ret('img', 'svc', 'UnsupportedImage');
s.ret('svc', 'ctrl', 'UnsupportedImage');
s.ret('ctrl', 'spa', '415 ProblemDetail');
s.otherwise('тип підтримується');
s.ret('img', 'svc', 'ProcessedImage<br>(ескіз, розміри)');
s.call('svc', 'store', 'write(id, оригінал)');
s.ret('store', 'svc');
s.call('svc', 'store', 'write(id.thumb.jpg, ескіз)');
s.ret('store', 'svc');
s.call('svc', 'repo', 'saveAndFlush(Media)');
s.ret('repo', 'svc');
s.ret('svc', 'ctrl', 'MediaView');
s.ret('ctrl', 'spa', '201 id, адреси файлів');
s.finish();
s.finish();

export default s.done();
