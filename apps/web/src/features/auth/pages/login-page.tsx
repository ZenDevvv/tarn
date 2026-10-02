import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@tracker/validation';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { StageRing } from '@/features/applications/components/application-status-badge';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'mika@example.com',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setServerError(null);
      await login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[420px] bg-card border border-border rounded-xl p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <StageRing status="OFFER" size={24} />
          <span className="font-display font-semibold text-subheading text-foreground tracking-tight">
            Tracker
          </span>
        </div>

        <h1 className="font-display font-semibold text-title text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="text-small text-muted-foreground mt-1 mb-6">
          Log in to manage your applications and today's actions.
        </p>

        {serverError && (
          <div className="mb-5 p-3 rounded-lg bg-destructive-tint text-destructive text-small border border-destructive/20" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-small font-medium text-foreground mb-1.5" htmlFor="email">
              Email address (required)
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full h-9 px-3 rounded-md bg-card border border-input text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-caption text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-small font-medium text-foreground mb-1.5" htmlFor="password">
              Password (required)
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full h-9 px-3 rounded-md bg-card border border-input text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-caption text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 mt-2 inline-flex items-center justify-center rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-body transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-border flex flex-col gap-3 text-center">
          <p className="text-small text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-foreground hover:underline">
              Create an account
            </Link>
          </p>

          <p className="text-caption text-muted-foreground bg-secondary/50 rounded-md p-2">
            Demo user: <strong>mika@example.com</strong> / <strong>password123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
