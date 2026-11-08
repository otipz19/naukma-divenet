import { Figure } from '../lib.mjs';

const f = new Figure('state-refresh-token', 'stm Життєвий цикл токена оновлення сесії', { width: 1000, height: 460 });
const state = (name, description) => `<b>${name}</b><hr size="1">${description}`;

f.node('start', 'initial', 485, 50, 30, 30);
f.node('active', 'state', 390, 135, 220, 100, state('ACTIVE', 'дійсний, можна обміняти<br>на новий токен'));
f.node('expired', 'state', 30, 135, 170, 100, state('EXPIRED', 'термін дії сплив'));
f.node('rotated', 'state', 800, 135, 170, 100, state('ROTATED', 'замінений новим токеном'));
f.node('revoked', 'state', 390, 340, 220, 90, state('REVOKED', 'відкликаний назавжди'));

f.edge('start', 'active', 'transition', ['b'], ['t'], { label: 'login() або register()', labelOffset: [72, 0] });
f.edge('active', 'expired', 'transition', ['l'], ['r'], { label: 'after(14 днів)', labelOffset: [0, -11] });
f.edge('active', 'rotated', 'transition', ['r'], ['l'], {
  label: 'refresh()<br>/ новий токен тієї ж сім’ї',
  labelOffset: [0, -19],
});
f.edge('active', 'revoked', 'transition', ['b'], ['t'], {
  label: 'logout() або<br>відкликання сім’ї',
  labelOffset: [62, 0],
});
f.edge('rotated', 'revoked', 'transition', ['b'], ['r'], {
  via: [[885, 385]],
  label: 'logout() або повторне використання<br>/ revokeFamily()',
  labelOffset: [0, -19],
});

export default f;
