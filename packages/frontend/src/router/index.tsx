import React from 'react';
import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ChatPage from '../pages/ChatPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import PromptManagementPage from '../pages/PromptManagementPage';
import ModelManagementPage from '../pages/ModelManagementPage';
import InviteCodeManagementPage from '../pages/InviteCodeManagementPage';
import UserManagementPage from '../pages/UserManagementPage';
import SystemSettingsPage from '../pages/SystemSettingsPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import PricingPage from '../pages/PricingPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import OAuthCallbackPage from '../pages/OAuthCallbackPage';
import PaymentSuccessPage from '../pages/PaymentSuccessPage';
import PaymentCancelPage from '../pages/PaymentCancelPage';
import SubscriptionManagementPage from '../pages/SubscriptionManagementPage';
import InterviewPage from '../pages/InterviewPage';
import PitchPerfectPage from '../pages/PitchPerfectPage';
import StrategistPage from '../pages/StrategistPage';
import RolePlayPage from '../pages/RolePlayPage';
import AgentMetricsPage from '../pages/AgentMetricsPage';
import KnowledgeBasePage from '../pages/KnowledgeBasePage';
import ResumeBuilderPage from '../pages/ResumeBuilderPage';
import MyResumesPage from '../pages/MyResumesPage';

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/oauth/callback',
    element: <OAuthCallbackPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/terms-of-service',
    element: <TermsOfServicePage />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
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
        path: 'knowledge-base',
        element: (
          <ProtectedRoute>
            <KnowledgeBasePage />
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
            path: 'invites',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <InviteCodeManagementPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings',
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const router: any = createBrowserRouter(routes);
