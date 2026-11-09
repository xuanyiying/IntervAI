import { Logo } from '@/shared/components/Logo';
import { useAuthStore } from '@/features/auth';
import { useResumeStore } from '@/features/resume';
import { Role } from '@/shared/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const IconHome: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconFileSearch: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconRobot: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const IconStar: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconMenuFold: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconMenuUnfold: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconTeam: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconApi: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconFileText: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconWallet: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
);

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  setMobileDrawerOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  setMobileDrawerOpen,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { fetchResumes } = useResumeStore();

  const isAdmin = user?.role === Role.ADMIN;
  const IS_EE = import.meta.env.VITE_APP_EDITION !== 'oss';

  React.useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const mainNavItems = [
    {
      key: 'home',
      icon: <IconHome />,
      label: t('menu.home', '主页'),
      path: '/',
    },
    {
      key: 'my-resumes',
      icon: <IconFileSearch />,
      label: t('menu.my_resumes', '我的简历'),
      path: '/resumes',
    },
    {
      key: 'interview',
      icon: <IconRobot />,
      label: t('menu.interview_spirit', 'AI 面试精灵'),
      path: '/interview',
    },
    {
      key: 'pitch-perfect',
      icon: <IconStar />,
      label: t('menu.pitch_perfect', '自我介绍'),
      path: '/pitch-perfect',
    },
    ...(IS_EE
      ? [
          {
            key: 'pricing',
            icon: <IconWallet />,
            label: t('menu.pricing', '订阅与定价'),
            path: '/pricing',
          },
        ]
      : []),
  ];

  const adminNavItems = [
    {
      key: 'users',
      icon: <IconTeam />,
      label: t('menu.user_management'),
      path: '/admin/users',
    },
    {
      key: 'models',
      icon: <IconApi />,
      label: t('menu.model_management'),
      path: '/admin/models',
    },
    {
      key: 'prompts',
      icon: <IconFileText />,
      label: t('menu.prompt_management'),
      path: '/admin/prompts',
    },
  ];

  return (
    <div
      className={`sidebar-wrapper ${isCollapsed ? 'collapsed' : ''}`}
      style={{ background: 'transparent' }}
    >
      <div
        className={`sidebar-brand h-16 flex items-center px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
      >
        <div className="flex items-center gap-2">
          <Logo width={32} height={32} />
          {!isCollapsed && (
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-secondary-400">
              {t('common.app_name')}
            </span>
          )}
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-item-hover)] transition-colors ${isCollapsed ? '' : 'ml-auto'}`}
            title={isCollapsed ? t('menu.expand') : t('menu.collapse')}
          >
            {isCollapsed ? (
              <IconMenuUnfold size={20} />
            ) : (
              <IconMenuFold size={20} />
            )}
          </button>
        )}
      </div>

      <div className="px-2 space-y-1">
        {mainNavItems.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              navigate(item.path);
              if (setMobileDrawerOpen) setMobileDrawerOpen(false);
            }}
            className={`
              flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200
              ${
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
                  ? 'border-l-[3px] border-l-primary bg-[var(--sidebar-item-active)] text-primary'
                  : 'border-l-[3px] border-l-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-item-hover)]'
              }
            `}
            style={{
              paddingLeft: 'calc(var(--sidebar-item-padding-x) - 3px)',
              paddingRight: 'var(--sidebar-item-padding-x)',
              paddingTop: 'var(--sidebar-item-padding-y)',
              paddingBottom: 'var(--sidebar-item-padding-y)',
            }}
            title={isCollapsed ? item.label : ''}
          >
            <span className="flex items-center justify-center w-5">
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="truncate text-sm font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      {isAdmin && !isCollapsed && (
        <div className="mt-4 px-4 pb-4 border-t border-[var(--sidebar-item-hover)]">
          <div className="px-2 py-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-widest text-center">
            {t('menu.admin')}
          </div>
          <div className="flex flex-col items-center w-full space-y-1">
            {adminNavItems.map((item) => (
              <div
                key={item.key}
                onClick={() => {
                  navigate(item.path);
                  if (setMobileDrawerOpen) setMobileDrawerOpen(false);
                }}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-200 w-full
                  ${location.pathname.startsWith(item.path) ? 'bg-[var(--sidebar-item-active)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-item-hover)]'}
                `}
              >
                <span className="flex items-center justify-center w-5">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
