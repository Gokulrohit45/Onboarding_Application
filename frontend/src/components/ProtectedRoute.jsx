import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const urlToken = queryParams.get('token');
        
        if (urlToken) {
            localStorage.setItem('token', urlToken);
            
            // Clean up the URL to prevent token leaking
            queryParams.delete('token');
            queryParams.delete('status');
            const newSearch = queryParams.toString();
            const newUrl = location.pathname + (newSearch ? `?${newSearch}` : '');
            navigate(newUrl, { replace: true });
        }
    }, [location, navigate]);

    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        // Simple JWT decoding (base64)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        console.log("ProtectedRoute - Decoded Token:", decoded);

        // Check if face is verified
        if (!decoded.faceVerified) {
            console.warn("Face not verified. Redirecting to login...");
            return <Navigate to="/login" replace />;
        }
    } catch (e) {
        console.error("Token invalid:", e);
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
