import { http } from './http';

export function getSummaryStats() {
  return http.get('/stats/summary');
}

export function getPartnerStats(by = 'cp_firm') {
  return http.get(`/stats/partners?by=${by}`);
}
