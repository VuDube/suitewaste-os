import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api-client';
import type { User } from '@shared/types';
export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const token = useAuthStore(s => s.token);
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const logout = useAuthStore(s => s.logout);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const localToken = localStorage.getItem('token');
      if (!localToken) throw new Error('No token');
      return api<User>('/api/auth/me', {
        headers: { Authorization: `Bearer ${localToken}` },
      });
    },
    enabled: !isAuthenticated && !!localStorage.getItem('token'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);
  useEffect(() => {
    if (isError) {
      logout();
      queryClient.clear();
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true, state: { from: location.pathname, reason: 'session_expired' } });
      }
    }
  }, [isError, logout, navigate, location.pathname, queryClient]);
  return { user, token, isAuthenticated, isLoading };
}