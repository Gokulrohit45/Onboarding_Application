import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminRoute;
