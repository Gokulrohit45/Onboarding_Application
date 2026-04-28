import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import FaceVerification from './pages/FaceVerification';
import ResetPassword from './pages/ResetPassword';
import FaceMatch from './pages/FaceMatch';
import OfferPage from './pages/OfferPage';

import FaceCallback from './pages/FaceCallback';
import OfferEditor from './pages/OfferEditor';
import PolicyAgreement from './pages/PolicyAgreement';
import RelievingExperienceEditor from './pages/RelievingExperienceEditor';
import ProbationConfirmationEditor from './pages/ProbationConfirmationEditor';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import SalaryHikeEditor from './pages/SalaryHikeEditor';

import { EditableProvider } from './context/EditableContext';

function App() {
  return (
    <ErrorBoundary>
      <EditableProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/face-callback" element={<FaceCallback />} />

            {/* Admin Flow */}
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />

            {/* User Flow */}
            <Route path="/user/login" element={<Login />} />
            <Route path="/user/verify-face" element={<FaceVerification />} />
            <Route path="/user/reset-password" element={<ResetPassword />} />
            <Route path="/user/face-match" element={<FaceMatch />} />
            <Route 
              path="/user/offer" 
              element={
                <UserRoute>
                  <OfferPage />
                </UserRoute>
              } 
            />

            {/* Protected Editor Routes (Original) */}
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OfferEditor />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/policy"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PolicyAgreement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/relieving-letter"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RelievingExperienceEditor />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/probation-letter"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProbationConfirmationEditor />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/salary-hike"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SalaryHikeEditor />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </EditableProvider>
    </ErrorBoundary>
  );
}

export default App;
