import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@tracker/validation';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { StageRing } from '@/features/applications/components/application-status-badge';

export function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setServerError(null);
      await registerAuth(data);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Failed to create account. Please try again.');
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
          Create your account
        </h1>
        <p className="text-small text-muted-foreground mt-1 mb-6">
          Start organizing and managing your job search.
        </p>

        {serverError && (
          <div className="mb-5 p-3 rounded-lg bg-destructive-tint text-destructive text-small border border-destructive/20" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-small font-medium text-foreground mb-1.5" htmlFor="name">
              Full name (required)
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="w-full h-9 px-3 rounded-md bg-card border border-input text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
              placeholder="Mika Santos"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-caption text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

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
              Password (required, 8+ characters)
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
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
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center">
          <p className="text-small text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
