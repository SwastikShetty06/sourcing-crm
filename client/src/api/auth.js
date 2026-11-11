import { http } from './http';

export function getSetupStatus() {
  return http.get('/auth/setup-status');
}

export function setupAdmin(data) {
  return http.post('/auth/setup', data);
}

export function register(userData) {
  return http.post('/auth/register', userData);
}

export function login(credentials) {
  return http.post('/auth/login', credentials);
}

export function logout() {
  return http.post('/auth/logout');
}

export function getMe() {
  return http.get('/auth/me');
}

export function changePassword(passwords) {
  return http.post('/auth/change-password', passwords);
}
