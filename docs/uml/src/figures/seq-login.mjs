import { Sequence } from '../sequence.mjs';

const s = new Sequence('seq-login', 'sd Вхід у систему', [
  ['spa', ':SPA'],
  ['ctrl', ':AuthController'],
  ['svc', ':AuthService'],
  ['users', ':UserRepository'],
  ['tokens', ':RefreshToken<br>Repository'],
  ['jwt', ':TokenService'],
]);

s.open('spa');
s.call('spa', 'ctrl', 'POST /auth/login<br>(email, password)');
s.call('ctrl', 'svc', 'login(email, password)');
s.call('svc', 'users', 'findByEmail(email)');
s.ret('users', 'svc', 'User або порожньо');
s.self('svc', 'перевірити пароль<br>(bcrypt)');
s.begin('alt', 'spa', 'jwt', 'користувача немає або пароль неправильний');
s.ret('svc', 'ctrl', 'InvalidCredentials<br>Exception');
s.ret('ctrl', 'spa', '401 ProblemDetail');
s.otherwise('пароль правильний');
s.call('svc', 'tokens', 'save(RefreshToken)');
s.ret('tokens', 'svc');
s.call('svc', 'jwt', 'issueAccessToken(user)');
s.ret('jwt', 'svc', 'JWT, 15 хв');
s.ret('svc', 'ctrl', 'AuthResult');
s.self('ctrl', 'RefreshCookie.set()');
s.ret('ctrl', 'spa', '200 accessToken, user<br>+ HttpOnly cookie');
s.self('spa', 'signIn(): токен лише<br>в пам’яті');
s.finish();
s.note(
  30,
  760,
  56,
  'Реєстрація (POST /auth/register) відрізняється лише першими кроками: перевіряється унікальність email і створюється User з роллю USER. Далі сесія починається так само, як у гілці «пароль правильний».',
);

export default s.done();
