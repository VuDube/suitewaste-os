import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LeafLogo } from '@/components/PageLayout';
/**
 * Root Entry Point
 * Handles redirection based on authentication state.
 */
export function HomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      if (user.role === 'operator') {
        navigate('/quick-weight', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);
  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center bg-[#1a3620]">
      <LeafLogo className="h-16 w-16 text-leaf animate-pulse mb-8" />
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-leaf animate-load" />
      </div>
    </div>
  );
}