import { Figure } from '../lib.mjs';

const f = new Figure('class-catalog', 'class Каталог дайв-сайтів і географія', { width: 1000, height: 620 });

f.cls('country', 30, 60, 200, 'Country', ['- code: String', '- name: String']);
f.cls('region', 30, 230, 200, 'Region', ['- code: String', '- name: String']);
f.node('user', 'ref', 30, 345, 200, 44, 'User');

f.cls(
  'site',
  330,
  60,
  290,
  'Site',
  [
    '- id: Long',
    '- name: String',
    '- location: Point',
    '- description: String',
    '- difficulty: int',
    '- minDepth: int',
    '- maxDepth: int',
    '- status: SiteStatus',
    '- rejectionReason: String [0..1]',
    '- ratingAverage: BigDecimal [0..1]',
    '- ratingCount: int',
    '- reviewCount: int',
    '- communityDifficulty: BigDecimal [0..1]',
    '- createdAt: Instant',
  ],
  ['+ submission(...): Site', '+ approve(): void', '+ reject(reason: String): void', '+ setReviewAggregates(...): void'],
);
f.cls('status', 370, 490, 210, 'SiteStatus', ['PENDING', 'APPROVED', 'REJECTED'], [], { stereotype: '«enumeration»' });

f.cls('requirement', 730, 60, 230, 'GearRequirement', ['REQUIRED', 'RECOMMENDED'], [], { stereotype: '«enumeration»' });
f.cls('siteGear', 730, 215, 230, 'SiteGear', ['- gearCode: String', '- requirement: GearRequirement'], [], {
  stereotype: '«embeddable»',
});
f.cls('gear', 730, 380, 230, 'GearItem', ['- code: String', '- name: String']);

f.edge('country', 'region', 'composition', ['b'], ['t'], { ends: ['', '1..*'] });
f.edge('region', 'site', 'link', ['r', 275], ['l', 275], { ends: ['1', '0..*'] });
f.edge('user', 'site', 'link', ['r', 367], ['l', 367], { label: 'author', labelOffset: [0, 11], ends: ['0..1', '0..*'] });
f.edge('site', 'status', 'dependency', ['b', 475], ['t', 475]);
f.edge('site', 'siteGear', 'composition', ['r', 265], ['l', 265], { ends: ['', '0..*'] });
f.edge('siteGear', 'requirement', 'dependency', ['t'], ['b']);
f.edge('siteGear', 'gear', 'link', ['b'], ['t'], { ends: ['0..*', '1'] });

export default f;
