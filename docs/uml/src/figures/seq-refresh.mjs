import { Sequence } from '../sequence.mjs';

const s = new Sequence(
  'seq-refresh',
  'sd Тихе оновлення сесії із захистом від повторного використання',
  [
    ['spa', ':API-клієнт SPA'],
    ['ctrl', ':AuthController'],
    ['svc', ':AuthService'],
    ['repo', ':RefreshToken<br>Repository'],
  ],
  { pitch: 230 },
);

s.open('spa');
s.self('spa', 'запит отримав 401:<br>access-токен застарів');
s.call('spa', 'ctrl', 'POST /auth/refresh (cookie)');
s.call('ctrl', 'svc', 'refresh(token)');
s.call('svc', 'repo', 'findForUpdate(hash)');
s.ret('repo', 'svc', 'RefreshToken');
s.begin('alt', 'spa', 'repo', 'токен не знайдено, відкликано або термін сплив');
s.ret('svc', 'ctrl', 'InvalidRefreshTokenException');
s.self('ctrl', 'RefreshCookie.clear()');
s.ret('ctrl', 'spa', '401');
s.self('spa', 'signOut()');
s.otherwise('токен уже був замінений: повторне використання');
s.call('svc', 'repo', 'revokeFamily(familyId)');
s.ret('repo', 'svc');
s.ret('svc', 'ctrl', 'InvalidRefreshTokenException');
s.self('ctrl', 'RefreshCookie.clear()');
s.ret('ctrl', 'spa', '401');
s.self('spa', 'signOut()');
s.otherwise('токен дійсний');
s.self('svc', 'markRotated()');
s.call('svc', 'repo', 'save(новий токен тієї ж сім’ї)');
s.ret('repo', 'svc');
s.ret('svc', 'ctrl', 'AuthResult');
s.self('ctrl', 'RefreshCookie.set()');
s.ret('ctrl', 'spa', '200 новий access-токен + cookie');
s.self('spa', 'signIn(), повторити<br>початковий запит');
s.finish();

export default s.done();
