import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api-client';
import type { User } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster, toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { LeafLogo } from '@/components/PageLayout';
type LoginFormInputs = {
  username: string;
  password: string;
};
type LoginResponse = {
  user: User;
  token: string;
};
export function Login() {
  const navigate = useNavigate();
  const loginAction = useAuthStore((s) => s.login);
  const { register, handleSubmit } = useForm<LoginFormInputs>();
  useQuery({
    queryKey: ['auth-init'],
    queryFn: () => api<{ seeded: boolean }>('/api/auth/init'),
    retry: 3,
  });
  const mutation = useMutation({
    mutationFn: (credentials: LoginFormInputs) => api<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    onSuccess: (data) => {
      loginAction(data.user, data.token);
      toast.success(`Welcome back, ${data.user.username}!`);
      if (data.user.role === 'operator') {
        navigate('/quick-weight');
      } else {
        navigate('/');
      }
    },
    onError: (error) => {
      toast.error('Login Failed', { description: error.message });
    },
  });
  const onSubmit = (data: LoginFormInputs) => {
    mutation.mutate(data);
  };
  return (
    <div className="w-full h-dvh industrial-gradient relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 industrial-grid opacity-20" />
      <div className="absolute inset-0 scanline-overlay opacity-10" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-leaf/20 blur-[150px] -z-10 animate-pulse-slow" />
      <Card className="w-full max-w-md glass-panel border-white/10 animate-fade-in relative z-10 shadow-elevation-12">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 h-24 w-24 flex items-center justify-center rounded-3xl bg-primary/20 leaf-glow relative overflow-hidden group">
            <LeafLogo className="h-12 w-12 text-leaf transition-transform duration-500 group-hover:scale-110" />
          </div>
          <CardTitle className="text-4xl font-black tracking-tighter uppercase text-white drop-shadow-md">
            SuiteWaste <span className="text-leaf">OS</span>
          </CardTitle>
          <CardDescription className="text-white/60 font-bold uppercase tracking-widest text-[10px] mt-2">
            Industrial Edge Environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/80 font-black uppercase text-[10px] tracking-widest ml-1">Identity</Label>
              <Input
                id="username"
                type="text"
                placeholder="Operator ID"
                required
                {...register('username')}
                className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-leaf transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 font-black uppercase text-[10px] tracking-widest ml-1">Access PIN</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••"
                required
                {...register('password')}
                className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-leaf transition-all"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-16 text-lg font-black uppercase tracking-widest bg-leaf hover:bg-leaf/90 text-white rounded-2xl shadow-elevation-12 leaf-glow transition-all active:scale-95" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Authorize'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Toaster richColors theme="dark" position="top-center" />
    </div>
  );
}