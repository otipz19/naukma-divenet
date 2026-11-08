import { Figure } from '../lib.mjs';

const f = new Figure('class-review-layers', 'class Шари back-end на прикладі відгуків', { width: 1000, height: 770 });

f.node('pkgWeb', 'pkg', 25, 45, 950, 165, 'review.web');
f.node('pkgService', 'pkg', 25, 235, 950, 290, 'review.service');
f.node('pkgDomain', 'pkg', 25, 550, 950, 205, 'review.domain');

f.cls('request', 50, 80, 240, 'ReviewRequest', ['rating, difficulty: Integer [0..1]', 'text: String [0..1]', 'photoIds, videoIds: List&lt;UUID&gt;'], [], { stereotype: '«record»' });
f.cls('controller', 370, 75, 260, 'ReviewController', [], ['list(...): PagedModel', 'create(...): ReviewResponse', 'update(...): ReviewResponse', 'delete(...): void'], { stereotype: '«RestController»' });
f.cls('response', 710, 95, 240, 'ReviewResponse', ['поля відгуку для клієнта'], [], { stereotype: '«record»' });

f.cls('view', 50, 300, 220, 'ReviewView', ['поля відгуку, автор, медіа'], [], { stereotype: '«record»' });
f.cls(
  'service',
  370,
  265,
  280,
  'ReviewService',
  ['- clock: Clock'],
  ['+ list(siteId, sort, page, size): Page', '+ mine(siteId, userId): ReviewView', '+ create(siteId, authorId, content)', '+ update(id, userId, content)', '+ delete(id, userId): void', '- refreshAggregates(siteId): void'],
  { stereotype: '«Service»' },
);
f.node('catalog', 'ref', 750, 270, 200, 50, '«Service»<br>site: SiteCatalogService');
f.node('media', 'ref', 750, 345, 200, 50, '«Service»<br>media: MediaService');
f.node('certs', 'ref', 750, 410, 200, 50,'«Service»<br>user: CertificateService');

f.cls('reviewMedia', 50, 610, 190, 'ReviewMedia', ['- mediaId: UUID', '- position: short'], [], { stereotype: '«embeddable»' });
f.cls('review', 320, 580, 220, 'Review', ['- rating: Short [0..1]', '- difficulty: Short [0..1]', '- text: String [0..1]'], ['+ setContent(...): void'], { stereotype: '«Entity»' });
f.cls(
  'repo',
  630,
  580,
  320,
  'ReviewRepository',
  [],
  ['findNewest(siteId, pageable): Page', 'findHighestRated(siteId, pageable): Page', 'existsBySite_IdAndAuthor_Id(...): boolean', 'aggregates(siteId): Aggregates'],
  { stereotype: '«interface» JpaRepository' },
);

f.edge('controller', 'request', 'dependency', ['l', 140], ['r', 140]);
f.edge('controller', 'response', 'dependency', ['r', 140], ['l', 140]);
f.edge('controller', 'service', 'dependency', ['b'], ['t', 500]);
f.edge('service', 'view', 'dependency', ['l', 345], ['r', 345]);
f.edge('service', 'catalog', 'dependency', ['r', 295], ['l', 295]);
f.edge('service', 'media', 'dependency', ['r', 370], ['l', 370]);
f.edge('service', 'certs', 'dependency', ['r', 435], ['l', 435]);
f.edge('service', 'review', 'dependency', ['b', 430], ['t', 430]);
f.edge('service', 'repo', 'dependency', ['b', 640], ['t', 640]);
f.edge('repo', 'review', 'dependency', ['l', 640], ['r', 640]);
f.edge('review', 'reviewMedia', 'composition', ['l', 650], ['r', 650], { label: 'photos, videos', labelOffset: [0, 12], ends: ['', '0..*'] });

export default f;
