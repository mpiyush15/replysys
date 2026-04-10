'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call backend signup endpoint
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/auth/register`,
        {
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'client', // Free accounts default to client
        }
      );

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
      >
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Account Created Successfully!
        </h3>
        <p className="text-green-700 text-sm">
          A welcome email has been sent. Redirecting to login...
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium text-mauve-900 mb-2">
          Full Name
        </label>
        <input
          {...register('name')}
          type="text"
          placeholder="John Doe"
          className="w-full px-4 py-2.5 border-2 border-mauve-200 rounded-lg focus:outline-none focus:border-mauve-500 bg-mauve-50 transition"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-mauve-900 mb-2">
          Email Address
        </label>
        <input
          {...register('email')}
          type="email"
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 border-2 border-mauve-200 rounded-lg focus:outline-none focus:border-mauve-500 bg-mauve-50 transition"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-sm font-medium text-mauve-900 mb-2">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          placeholder="••••••••"
          className="w-full px-4 py-2.5 border-2 border-mauve-200 rounded-lg focus:outline-none focus:border-mauve-500 bg-mauve-50 transition"
        />
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label className="block text-sm font-medium text-mauve-900 mb-2">
          Confirm Password
        </label>
        <input
          {...register('confirmPassword')}
          type="password"
          placeholder="••••••••"
          className="w-full px-4 py-2.5 border-2 border-mauve-200 rounded-lg focus:outline-none focus:border-mauve-500 bg-mauve-50 transition"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isLoading}
        className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg hover:bg-slate-800 transition border-2 border-slate-900 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </motion.button>

      {/* Terms */}
      <p className="text-xs text-mauve-600 text-center mt-4">
        By signing up, you agree to our{' '}
        <a href="#" className="underline hover:text-mauve-900">
          Terms of Service
        </a>
        {' '}and{' '}
        <a href="#" className="underline hover:text-mauve-900">
          Privacy Policy
        </a>
      </p>
    </motion.form>
  );
}
