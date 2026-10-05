import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { ProtectedRoute } from '@/routes/protected-route';
import { AppLayout } from '@/layouts/app-layout';
import { ApplicationsPage } from '@/features/applications/pages/applications-page';
import { CreateApplicationPage } from '@/features/applications/pages/create-application-page';

import { ApplicationDetailPage } from '@/features/applications/pages/application-detail-page';
import { InterviewsPage } from '@/features/interviews/pages/interviews-page';
import { SavedJobsPage } from '@/features/saved-jobs/pages/saved-jobs-page';
import { CompaniesPage } from '@/features/companies/pages/companies-page';
import { ContactsPage } from '@/features/contacts/pages/contacts-page';
import { ResumesPage } from '@/features/resumes/pages/resumes-page';

import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/applications',
            element: <ApplicationsPage />,
          },
          {
            path: '/applications/new',
            element: <CreateApplicationPage />,
          },
          {
            path: '/applications/:id',
            element: <ApplicationDetailPage />,
          },
          {
            path: '/companies',
            element: <CompaniesPage />,
          },
          {
            path: '/companies/:id',
            element: <CompaniesPage />,
          },
          {
            path: '/contacts',
            element: <ContactsPage />,
          },
          {
            path: '/interviews',
            element: <InterviewsPage />,
          },
          {
            path: '/saved-jobs',
            element: <SavedJobsPage />,
          },
          {
            path: '/resumes',
            element: <ResumesPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
