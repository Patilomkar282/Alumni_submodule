import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProtectedRoute = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const path = window.location.pathname;
    const isAdminPath = path.startsWith('/admin');

    if (!userInfo) {
        window.location.href = 'https://www.smartprep.live/login';
        return null;
    }

    // Admin paths use AdminLayout — no Header/Footer needed here
    if (isAdminPath) {
        return <Outlet />;
    }

    // Step 1: Redirect to profile if profile is incomplete (all roles)
    const isProfilePath = path.includes('/profile');
    if (!userInfo.isProfileComplete && !isProfilePath) {
        return <Navigate to={`/${userInfo.role}/profile`} replace />;
    }

    // Step 2: Alumni-only gate — profile complete but not yet verified by admin
    // Allow: profile page, verification page
    const isVerificationPath = path.includes('/verification');
    if (
        userInfo.role === 'alumni' &&
        userInfo.isProfileComplete &&
        !userInfo.isVerified &&
        !isProfilePath &&
        !isVerificationPath
    ) {
        return <Navigate to="/alumni/verification" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
