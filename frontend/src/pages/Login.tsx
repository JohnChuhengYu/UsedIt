import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await api.post('/auth/register', { username, password });
      }
      const result = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', result.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="max-w-md mx-auto mt-24 px-8">
      <h1 className="text-4xl font-serif mb-8">
        {isRegister ? 'Create Account' : 'Sign In'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border-b border-gray-200 py-2 focus:outline-none focus:border-gray-900"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-b border-gray-200 py-2 focus:outline-none focus:border-gray-900"
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-black text-white py-3 mt-4">
          {isRegister ? 'Register' : 'Sign In'}
        </button>
      </form>

      <button
        onClick={handleGoogleLogin}
        className="w-full border border-gray-300 py-3 mt-4"
      >
        Continue with Google
      </button>

      <p className="text-sm text-gray-500 mt-6 text-center">
        {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        <button onClick={() => setIsRegister(!isRegister)} className="underline">
          {isRegister ? 'Sign In' : 'Register'}
        </button>
      </p>
    </div>
  );
}
