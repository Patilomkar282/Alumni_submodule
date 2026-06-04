import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const authenticate = async () => {
      // 1. Check for token in URL
      const searchParams = new URLSearchParams(location.search);
      const tokenFromUrl = searchParams.get('token');

      let token = tokenFromUrl || localStorage.getItem('token');

      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (!token) {
        window.location.href = 'http://localhost:5174/login';
        return;
      }

      try {
        // 2. Fetch full user info from Alumni Backend
        const res = await fetch('http://localhost:5001/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch profile from Alumni backend');
        }

        let userInfo = await res.json();
        userInfo = { ...userInfo, token }; // Ensure token is inside userInfo
        
        // Save userInfo so ProtectedRoute works seamlessly
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        // 3. Redirect based on role
        if (userInfo.role === 'student') {
          navigate('/student/dashboard', { replace: true });
        } else if (userInfo.role === 'alumni') {
          navigate('/alumni/dashboard', { replace: true });
        } else if (userInfo.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          setError('Invalid role assigned to your account.');
        }
      } catch (err) {
        console.error('Authentication Error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = 'http://localhost:5174/login';
      }
    };

    authenticate();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = 'http://localhost:5174/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Authenticating via SmartPrep Central...</p>
      </div>
    </div>
  );
}
