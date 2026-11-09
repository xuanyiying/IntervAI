import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { AppLayout } from '@/app/layouts';
import { ErrorBoundary } from '@/shared/components';
import {
  ModelManagementPage,
  PromptManagementPage,
  UserManagementPage,
} from '@/features/admin';
import {
  ForgotPasswordPage,
  LoginPage,
  OAuthCallbackPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
  ProtectedRoute,
} from '@/features/auth';
import {
  AccountSubscriptionPage,
  AccountUsagePage,
  PaymentCancelPage,
  PaymentSuccessPage,
  SubscriptionManagementPage,
} from '@/features/billing';
import { InterviewPage } from '@/features/interview';
import { PrivacyPolicyPage, TermsOfServicePage } from '@/features/legal';
import { PitchPerfectPage } from '@/features/pitch-perfect';
import { MyResumesPage, ResumeBuilderPage } from '@/features/resume';
import { ProfilePage, SettingsPage } from '@/features/user';

const IS_EE = import.meta.env.VITE_APP_EDITION !== 'oss';

const PricingPage = IS_EE
  ? lazy(() => import('@/ee/pages/marketing/PricingPage'))
  : () => null;

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/oauth/callback',
    element: <OAuthCallbackPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/terms-of-service',
    element: <TermsOfServicePage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <MyResumesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'resumes',
        element: (
          <ProtectedRoute>
            <MyResumesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'resume-builder',
        element: (
          <ProtectedRoute>
            <ResumeBuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      ...(IS_EE
        ? [
            {
              path: 'pricing',
              element: (
                <ProtectedRoute>
                  <Suspense
                    fallback={<div className="p-8 text-center">Loading...</div>}
                  >
                    <PricingPage />
                  </Suspense>
                </ProtectedRoute>
              ),
            },
            {
              path: 'payment/success',
              element: (
                <ProtectedRoute>
                  <PaymentSuccessPage />
                </ProtectedRoute>
              ),
            },
            {
              path: 'payment/cancel',
              element: (
                <ProtectedRoute>
                  <PaymentCancelPage />
                </ProtectedRoute>
              ),
            },
            {
              path: 'subscription',
              element: (
                <ProtectedRoute>
                  <SubscriptionManagementPage />
                </ProtectedRoute>
              ),
            },
            {
              path: 'account/subscription',
              element: (
                <ProtectedRoute>
                  <AccountSubscriptionPage />
                </ProtectedRoute>
              ),
            },
          ]
        : []),
      {
        path: 'account/usage',
        element: (
          <ProtectedRoute>
            <AccountUsagePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'interview',
        element: (
          <ProtectedRoute>
            <InterviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pitch-perfect',
        element: (
          <ProtectedRoute>
            <PitchPerfectPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        children: [
          {
            path: 'prompts',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <PromptManagementPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'models',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <ModelManagementPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'users',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <UserManagementPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
