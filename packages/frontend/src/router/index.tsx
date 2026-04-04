import InviteCodeManagementPage from '@/pages/admin/InviteCodeManagementPage';
import KnowledgeBasePage from '@/pages/admin/KnowledgeBasePage';
import ModelManagementPage from '@/pages/admin/ModelManagementPage';
import PromptManagementPage from '@/pages/admin/PromptManagementPage';
import SystemSettingsPage from '@/pages/admin/SystemSettingsPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import LoginPage from '@/pages/auth/LoginPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import PrivacyPolicyPage from '@/pages/legal/PrivacyPolicyPage';
import TermsOfServicePage from '@/pages/legal/TermsOfServicePage';
import PricingPage from '@/pages/marketing/PricingPage';
import AccountSubscriptionPage from '@/pages/user/AccountSubscriptionPage';
import AccountUsagePage from '@/pages/user/AccountUsagePage';
import AgentMetricsPage from '@/pages/user/AgentMetricsPage';
import ChatPage from '@/pages/user/ChatPage';
import InterviewPage from '@/pages/user/InterviewPage';
import MyResumesPage from '@/pages/user/MyResumesPage';
import PaymentCancelPage from '@/pages/user/PaymentCancelPage';
import PaymentSuccessPage from '@/pages/user/PaymentSuccessPage';
import PitchPerfectPage from '@/pages/user/PitchPerfectPage';
import ProfilePage from '@/pages/user/ProfilePage';
import ResumeBuilderPage from '@/pages/user/ResumeBuilderPage';
import RolePlayPage from '@/pages/user/RolePlayPage';
import SettingsPage from '@/pages/user/SettingsPage';
import { StrategistPage } from '@/pages/user/StrategistPage';
import SubscriptionManagementPage from '@/pages/user/SubscriptionManagementPage';
import TeamPage from '@/pages/user/TeamPage';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../layouts/AppLayout';

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
        element: <ChatPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
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
      {
        path: 'pricing',
        element: (
          <ProtectedRoute>
            <PricingPage />
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
        path: 'strategist',
        element: (
          <ProtectedRoute>
            <StrategistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'role-play',
        element: (
          <ProtectedRoute>
            <RolePlayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'agent-metrics',
        element: (
          <ProtectedRoute>
            <AgentMetricsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'team',
        element: (
          <ProtectedRoute>
            <TeamPage />
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
          {
            path: 'invite-codes',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <InviteCodeManagementPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'knowledge-base',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <KnowledgeBasePage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'system-settings',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <SystemSettingsPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
