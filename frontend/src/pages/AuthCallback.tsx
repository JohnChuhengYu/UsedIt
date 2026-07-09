import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * /auth/callback — receives the JWT token from the Google OAuth redirect,
 * stores it in localStorage, and redirects to the home page.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      // Small delay so the user sees the success state briefly
      setTimeout(() => navigate('/', { replace: true }), 600);
    } else {
      setError('Login failed — no token received.');
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <a
              href="/"
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            >
              Back to Home
            </a>
          </>
        ) : (
          <>
            <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-sm text-gray-500 tracking-wide">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
