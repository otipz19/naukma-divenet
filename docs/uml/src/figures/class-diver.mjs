import { Figure } from '../lib.mjs';

const f = new Figure('class-diver', 'class Обліковий запис і діяльність дайвера', { width: 1000, height: 690 });

f.cls(
  'token',
  30,
  50,
  230,
  'RefreshToken',
  ['- id: Long', '- familyId: UUID', '- tokenHash: String', '- createdAt: Instant', '- expiresAt: Instant', '- rotatedAt: Instant [0..1]', '- revokedAt: Instant [0..1]'],
  ['+ markRotated(now): void', '+ revoke(now): void'],
);
f.cls(
  'certificate',
  30,
  310,
  230,
  'Certificate',
  ['- id: Long', '- agency: String', '- level: String', '- number: String', '- photoId: UUID [0..1]', '- status: Status', '- rejectionReason: String [0..1]', '- verifiedAt: Instant [0..1]', '- createdAt: Instant', '- updatedAt: Instant'],
  ['+ declare(...): void', '+ verify(now): void', '+ reject(reason, now): void'],
);

f.cls('role', 410, 50, 180, 'Role', ['USER', 'ADMIN'], [], { stereotype: '«enumeration»' });
f.cls(
  'user',
  375,
  185,
  250,
  'User',
  ['- id: Long', '- email: String', '- displayName: String', '- passwordHash: String', '- role: Role', '- bio: String [0..1]', '- avatarId: UUID [0..1]', '- showDiveLog: boolean', '- showStatistics: boolean', '- showCertificates: boolean', '- createdAt: Instant'],
  [],
  { minHeight: 275 },
);
f.cls('award', 375, 555, 250, 'UserAchievement', ['- userId: long', '- achievementCode: String', '- earnedAt: Instant']);

f.node('site', 'ref', 740, 40, 230, 36, 'Site');
f.cls(
  'dive',
  740,
  145,
  230,
  'DiveLogEntry',
  ['- id: Long', '- date: LocalDate', '- maxDepth: BigDecimal [0..1]', '- visibility: BigDecimal [0..1]', '- waterTemperature: BigDecimal [0..1]', '- current: String [0..1]', '- buddies: String [0..1]', '- notes: String [0..1]', '- createdAt: Instant', '- updatedAt: Instant'],
);
f.cls('locker', 740, 385, 230, 'LockerItem', ['- id: Long', '- name: String', '- createdAt: Instant']);
f.cls('achievement', 740, 545, 230, 'Achievement', ['- code: String', '- name: String', '- metric: Metric', '- target: int', '- position: short']);

f.edge('token', 'user', 'link', ['r', 215], ['l', 215], { ends: ['0..*', '1'] });
f.edge('certificate', 'user', 'link', ['r', 380], ['l', 380], { ends: ['0..*', '1'] });
f.edge('user', 'role', 'dependency', ['t'], ['b']);
f.edge('dive', 'user', 'link', ['l', 260], ['r', 260], { ends: ['0..*', '1'] });
f.edge('dive', 'site', 'link', ['t'], ['b'], { ends: ['0..*', '1'] });
f.edge('locker', 'user', 'link', ['l', 430], ['r', 430], { ends: ['0..*', '1'] });
f.edge('award', 'user', 'link', ['t'], ['b'], { ends: ['0..*', '1'] });
f.edge('award', 'achievement', 'link', ['r', 610], ['l', 610], { ends: ['0..*', '1'] });

export default f;
