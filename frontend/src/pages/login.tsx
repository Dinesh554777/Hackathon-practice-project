import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, mfaLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState('');
  const [mfaToken, setMfaToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      if (err.mfaRequired) {
        setMfaRequired(true);
        setMfaUserId(err.userId);
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    }
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await mfaLogin(mfaUserId, mfaToken);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'MFA verification failed');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">
          {mfaRequired ? 'Two-Factor Authentication' : 'Sign In'}
        </h1>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {mfaRequired ? (
          <form onSubmit={handleMfa} className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 p-3 text-center text-lg tracking-widest focus:border-primary-500 focus:outline-none"
              autoFocus
            />
            <button type="submit" className="w-full rounded-lg bg-primary-600 py-3 text-white hover:bg-primary-700">
              Verify
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary-500 focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary-500 focus:outline-none"
              required
            />
            <button type="submit" className="w-full rounded-lg bg-primary-600 py-3 text-white hover:bg-primary-700">
              Sign In
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
