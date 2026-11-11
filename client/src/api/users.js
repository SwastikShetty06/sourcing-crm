import { http } from './http';

export function getUsers() {
  return http.get('/users');
}

export function createUser(userData) {
  return http.post('/users', userData);
}

export function updateUser(id, updates) {
  return http.patch(`/users/${id}`, updates);
}

export function resetUserPassword(id, password) {
  return http.post(`/users/${id}/reset-password`, { password });
}
