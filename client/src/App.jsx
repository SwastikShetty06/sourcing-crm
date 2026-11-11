import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { RequireAdmin } from './auth/RequireAdmin';
import { AppShell } from './components/AppShell';

import { Setup } from './pages/Setup';
import { Login } from './pages/Login';
import { Account } from './pages/Account';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { NewVisit } from './pages/NewVisit';
import { ClientDetail } from './pages/ClientDetail';
import { Partners } from './pages/Partners';
import { Team } from './pages/Team';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/setup" element={<Setup />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/new" element={<NewVisit />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="partners" element={<Partners />} />
              <Route path="account" element={<Account />} />
              <Route
                path="team"
                element={
                  <RequireAdmin>
                    <Team />
                  </RequireAdmin>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
