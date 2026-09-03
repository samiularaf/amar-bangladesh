import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitProblem from './pages/SubmitProblem';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-[#006A4E]">লোড হচ্ছে...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function AdminOnly() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'submit', element: <SubmitProblem /> },
      { path: 'problems', element: <Problems /> },
      { path: 'problems/:id', element: <ProblemDetail /> },
      { path: 'courses', element: <Courses /> },
      { path: 'courses/:id', element: <CourseDetail /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'admin', element: <AdminOnly /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
