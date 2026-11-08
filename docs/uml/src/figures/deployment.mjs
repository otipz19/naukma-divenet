import { Figure } from '../lib.mjs';

const f = new Figure('deployment', 'deployment Розгортання системи DiveNet', { width: 980, height: 760 });

// Left column: the user's device, the external tile server and the note.
f.node('client', 'node', 30, 60, 250, 240, '«device»<br><b>Пристрій користувача</b>');
f.node('browser', 'node', 45, 115, 220, 170, '«execution environment»<br><b>Веб-браузер</b>', 'client');
f.node('spa', 'artifact', 65, 195, 175, 70, '«artifact»<br>Застосунок SPA<br>(React, JavaScript)', 'browser');
f.node('osm', 'node', 30, 420, 250, 80, '«device»<br><b>Сервер OpenStreetMap</b>');
f.node(
  'note',
  'note',
  30,
  590,
  250,
  110,
  'Назовні опубліковано лише порт сервісу web. Сервіси backend, db і minio доступні тільки у внутрішній мережі Docker.',
);

// Right column: the host and its containers, from the entry point down to the data.
f.node('host', 'node', 430, 60, 520, 670, '«device»<br><b>Хост Docker (Docker Compose)</b>');
f.node('web', 'node', 470, 120, 440, 125, '«container» <b>web</b><br>nginx:1.29-alpine', 'host');
f.node('dist', 'artifact', 490, 178, 195, 52, '«artifact»<br>Статична збірка SPA', 'web');
f.node('conf', 'artifact', 700, 178, 190, 52, '«artifact»<br>nginx.conf', 'web');
f.node('backend', 'node', 470, 315, 440, 125, '«container» <b>backend</b><br>eclipse-temurin:25-jre', 'host');
f.node('jar', 'artifact', 590, 373, 200, 52, '«artifact»<br>app.jar (Spring Boot)', 'backend');
f.node('db', 'node', 470, 510, 205, 80, '«container» <b>db</b><br>postgis/postgis:17-3.5', 'host');
f.node('minio', 'node', 705, 510, 205, 80, '«container» <b>minio</b><br>Chainguard MinIO', 'host');
f.node('dbData', 'artifact', 470, 655, 205, 55, '«volume»<br>db-data', 'host');
f.node('minioData', 'artifact', 705, 655, 205, 55, '«volume»<br>minio-data', 'host');

f.edge('browser', 'web', 'link', ['r', 180], ['l', 180], {
  label: '«HTTP»<br>порт WEB_PORT → 80',
  labelOffset: [-13, -24],
});
f.edge('browser', 'osm', 'link', ['b', 155], ['t', 155], {
  label: '«HTTPS»<br>растрові тайли мапи',
  labelOffset: [72, 28],
});
f.edge('web', 'backend', 'link', ['b', 690], ['t', 690], {
  label: '«HTTP» порт 8080<br>шляхи /api/ і /media/',
  labelOffset: [78, 0],
});
f.edge('backend', 'db', 'link', ['b', 572], ['t', 572], { label: '«JDBC»<br>порт 5432', labelOffset: [40, 0] });
f.edge('backend', 'minio', 'link', ['b', 807], ['t', 807], { label: '«S3 API»<br>порт 9000', labelOffset: [-42, 0] });
f.edge('db', 'dbData', 'link', ['b'], ['t'], { label: '/var/lib/postgresql/data', labelOffset: [78, 0] });
f.edge('minio', 'minioData', 'link', ['b'], ['t'], { label: '/data', labelOffset: [26, 0] });
f.edge('note', 'host', 'noteLink', ['r', 645], ['l', 645]);

export default f;
