import { Figure } from '../lib.mjs';

const f = new Figure('class-content', 'class Контент спільноти та медіафайли', { width: 1000, height: 690 });

// Plain boxes are classes detailed on other figures. Repeating them keeps the lines from crossing.
f.node('user1', 'ref', 30, 70, 110, 36, 'User');
f.node('site1', 'ref', 30, 170, 110, 36, 'Site');
f.node('user2', 'ref', 30, 320, 110, 52, 'User');
f.node('site2', 'ref', 30, 505, 110, 36, 'Site');
f.node('region', 'ref', 30, 585, 110, 36, 'Region');
f.node('user3', 'ref', 830, 60, 150, 36, 'User');

f.cls(
  'review',
  270,
  60,
  230,
  'Review',
  ['- id: Long', '- rating: Short [0..1]', '- difficulty: Short [0..1]', '- text: String [0..1]', '- createdAt: Instant', '- updatedAt: Instant'],
  ['+ setContent(...): void'],
);
f.cls(
  'warning',
  270,
  255,
  230,
  'Warning',
  ['- id: Long', '- type: WarningType', '- text: String', '- createdAt: Instant', '- updatedAt: Instant', '- hiddenAt: Instant [0..1]'],
  ['+ hide(admin, hiddenAt): void'],
);
f.cls(
  'post',
  270,
  450,
  230,
  'Post',
  ['- id: Long', '- title: String', '- text: String', '- status: Status', '- coverId: UUID [0..1]', '- publishedAt: Instant [0..1]', '- createdAt: Instant', '- updatedAt: Instant'],
  ['+ update(details, now): void'],
);

f.cls('reviewMedia', 610, 95, 140, 'ReviewMedia', ['- mediaId: UUID', '- position: short'], [], { stereotype: '«embeddable»' });
f.cls(
  'warningType',
  590,
  290,
  170,
  'WarningType',
  ['HAZARD', 'INCIDENT', 'CHANGED_CONDITIONS', 'MARINE_LIFE'],
  [],
  { stereotype: '«enumeration»' },
);
f.cls('postMedia', 610, 540, 140, 'PostMedia', ['- mediaId: UUID', '- position: short'], [], { stereotype: '«embeddable»' });
f.cls(
  'media',
  790,
  185,
  190,
  'Media',
  ['- id: UUID', '- contentType: String', '- sizeBytes: long', '- width: Integer [0..1]', '- height: Integer [0..1]', '- createdAt: Instant', '- attachedAt: Instant [0..1]'],
);

const leftX = 140;
const classX = 270;
f.edge('review', 'user1', 'link', ['l', 88], ['r', 88], { label: 'author', labelOffset: [0, 11], ends: ['0..*', '1'] });
f.edge('review', 'site1', 'link', ['l', 188], ['r', 188], { ends: ['0..*', '1'] });
f.edge('warning', 'site1', 'link', ['l', 285], ['b'], { via: [[85, 285]], ends: ['0..*', '1'] });
f.edge('warning', 'user2', 'link', ['l', 335], ['r', 335], { label: 'author', labelOffset: [0, -11] });
f.edge('warning', 'user2', 'link', ['l', 358], ['r', 358], { label: 'hiddenBy 0..1', labelOffset: [0, 11] });
f.edge('post', 'user2', 'link', ['l', 475], ['b'], { via: [[85, 475]], label: 'author', labelOffset: [40, -11], ends: ['0..*', '1'] });
f.edge('post', 'site2', 'link', ['l', 523], ['r', 523], { ends: ['0..*', '0..1'] });
f.edge('post', 'region', 'link', ['l', 603], ['r', 603], { ends: ['0..*', '0..1'] });

f.edge('review', 'reviewMedia', 'composition', ['r', 135], ['l', 135], { label: 'photos, videos', labelOffset: [8, 12], ends: ['', '0..*'] });
f.edge('warning', 'warningType', 'dependency', ['r', 335], ['l', 335]);
f.edge('post', 'postMedia', 'composition', ['r', 585], ['l', 585], { label: 'photos, videos', labelOffset: [8, 12], ends: ['', '0..*'] });
f.edge('reviewMedia', 'media', 'link', ['r', 135], ['t', 860], { via: [[860, 135]], ends: ['0..*', '1'] });
f.edge('postMedia', 'media', 'link', ['r', 585], ['b', 925], { via: [[925, 585]], ends: ['0..*', '1'] });
f.edge('post', 'media', 'link', ['r', 485], ['b', 850], { via: [[850, 485]], label: 'coverId', labelOffset: [0, -11], ends: ['0..*', '0..1'] });
f.edge('media', 'user3', 'link', ['t', 930], ['b', 930], { label: 'uploader', labelOffset: [32, 0], ends: ['0..*', '1'] });

export default f;
