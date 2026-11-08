import { Figure } from '../lib.mjs';

const f = new Figure('cmp-system', 'cmp Складові системи DiveNet', { width: 1000, height: 830 });
const cmp = (name, detail) => `«component»<br><b>${name}</b><br>${detail}`;

f.node('spa', 'component', 40, 70, 220, 90, cmp('SPA', 'React, Leaflet'));
f.node('httpBall', 'ballTop', 345, 105, 20, 20, 'HTTP');
f.node('nginx', 'component', 450, 70, 300, 90, cmp('nginx', 'статика, проксі /api і /media'));
f.node('tilesBall', 'ballRight', 140, 265, 20, 20, 'растрові тайли');
f.node('osm', 'component', 40, 385, 220, 80, cmp('OpenStreetMap', 'зовнішній сервіс тайлів'));
f.node(
  'note',
  'note',
  40,
  540,
  220,
  130,
  'Реалізацію MediaStorage обирає параметр divenet.media.storage: minio у стеку Docker Compose, local поза ним.',
);

f.node('restBall', 'ballRight', 590, 205, 20, 20, 'REST API /api/v1 і /media');
f.node('backend', 'boundary', 330, 265, 640, 410, '«component» Back-end (Spring Boot)');
f.node('web', 'component', 370, 310, 240, 70, cmp('web', 'контролери, DTO'));
f.node('service', 'component', 370, 430, 240, 70, cmp('service', 'бізнес-правила, транзакції'));
f.node('domain', 'component', 370, 565, 240, 70, cmp('domain', 'сутності, репозиторії'));
f.node('storageBall', 'ballRight', 690, 455, 20, 20, 'MediaStorage');
f.node('local', 'component', 790, 330, 165, 70, cmp('LocalDisk<br>MediaStorage', ''));
f.node('minioImpl', 'component', 790, 530, 165, 70, cmp('Minio<br>MediaStorage', ''));

f.node('jdbcBall', 'ballRight', 480, 705, 20, 20, 'JDBC');
f.node('postgres', 'component', 370, 750, 240, 65, cmp('PostgreSQL + PostGIS', ''));
f.node('s3Ball', 'ballRight', 862, 705, 20, 20, 'S3 API');
f.node('minio', 'component', 790, 750, 165, 65, cmp('MinIO', ''));

f.edge('spa', 'httpBall', 'dependency', ['r', 115], ['l', 115]);
f.edge('nginx', 'httpBall', 'link', ['l', 115], ['r', 115]);
f.edge('spa', 'tilesBall', 'dependency', ['b', 150], ['t', 150]);
f.edge('osm', 'tilesBall', 'link', ['t', 150], ['b', 150]);
f.edge('nginx', 'restBall', 'dependency', ['b', 600], ['t', 600]);
f.edge('web', 'restBall', 'link', ['t', 600], ['b', 600]);
f.edge('web', 'service', 'dependency', ['b'], ['t']);
f.edge('service', 'domain', 'dependency', ['b'], ['t']);
f.edge('service', 'storageBall', 'dependency', ['r', 465], ['l', 465]);
f.edge('local', 'storageBall', 'link', ['l', 365], ['t', 700], { via: [[700, 365]] });
f.edge('minioImpl', 'storageBall', 'link', ['l', 565], ['b', 700], { via: [[700, 565]] });
f.edge('domain', 'jdbcBall', 'dependency', ['b', 490], ['t', 490]);
f.edge('postgres', 'jdbcBall', 'link', ['t', 490], ['b', 490]);
f.edge('minioImpl', 's3Ball', 'dependency', ['b', 872], ['t', 872]);
f.edge('minio', 's3Ball', 'link', ['t', 872], ['b', 872]);

export default f;
