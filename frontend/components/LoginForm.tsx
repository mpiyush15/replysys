'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call backend login endpoint
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/auth/login`,
        {
          email: data.email,
          password: data.password,
        }
      );

      const user = response.data.user;
      const token = response.data.token;

      // Store user and token in auth store (which also stores token expiration)
      login(user, token);

      // Redirect based on role
      if (user.role === 'superadmin') {
        router.push('/superadmin/dashboard');
      } else if (user.role === 'client') {
        router.push('/client/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-mauve-900 mb-2">
          Email
        </label>
        <input
          type="email"
          {...register('email')}
          placeholder="you@example.com"
          className="w-full px-4 py-2 border border-mauve-200 rounded-lg focus:outline-none focus:border-mauve-500 focus:ring-2 focus:ring-mauve-100 text-mauve-900"
        />
        {errors.email && (
          <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-mauve-900 mb-2">
          Password
        </label>
        <input
          type="password"
          {...register('password')}
          placeholder="••••••••"
          className="w-full px-4 py-2 border border-mauve-200 rounded-lg focus:outline-none focus:border-mauve-500 focus:ring-2 focus:ring-mauve-100 text-mauve-900"
        />
        {errors.password && (
          <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isLoading}
        className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg hover:bg-slate-800 transition border-2 border-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </motion.button>

      <p className="text-center text-mauve-600 text-sm font-light">
        Don&apos;t have an account?{' '}
        <a href="#" className="text-mauve-700 hover:text-mauve-900 font-medium">
          Sign up
        </a>
      </p>
    </motion.form>
  );
}
