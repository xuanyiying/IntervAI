import React, { useState, useEffect } from 'react';
import { Layout, Button, Drawer, Avatar, Dropdown, MenuProps } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useAuthStore, useUIStore } from '@/stores';
import CookieConsent from '../components/CookieConsent';
import Sidebar from './components/Sidebar';
import { Logo } from '../components/Logo';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage } from '../i18n';
import './AppLayout.css';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const languageStorageKey = 'i18nextLng';
  const currentLanguage = normalizeLanguage(
    i18n.resolvedLanguage || i18n.language
  );

  const setLanguage = (language: string) => {
    const normalized = normalizeLanguage(language);
    try {
      localStorage.setItem(languageStorageKey, normalized);
    } catch (error) {
      void error;
    }
    i18n.changeLanguage(normalized);
  };

  const languageMenuItems: MenuProps['items'] = [
    {
      key: 'zh-CN',
      label: t('common.lang_cn'),
      onClick: () => setLanguage('zh-CN'),
    },
    {
      key: 'en-US',
      label: t('common.lang_en'),
      onClick: () => setLanguage('en-US'),
    },
  ];

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const guestMenuItems: MenuProps['items'] = [
    { type: 'divider' },
    {
      key: 'login',
      label: t('common.login', '登录'),
      icon: <UserOutlined />,
      onClick: () => navigate('/login'),
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: t('menu.profile'),
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      label: t('menu.settings'),
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings'),
    },
    {
      key: 'account',
      label: t('menu.account', '账户'),
      icon: <UserOutlined />,
      children: [
        {
          key: 'account_subscription',
          label: t('menu.account_subscription', '订阅记录'),
          icon: <DollarOutlined />,
          onClick: () => navigate('/account/subscription'),
        },
        {
          key: 'account_usage',
          label: t('menu.account_usage', '使用量'),
          icon: <ThunderboltOutlined />,
          onClick: () => navigate('/account/usage'),
        },
      ],
    },

    { type: 'divider' },
    {
      key: 'logout',
      label: t('menu.logout'),
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search in sidebar if needed, or global command palette
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(languageStorageKey);
      const normalized = normalizeLanguage(saved);
      const current = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
      if (normalized && normalized !== current) {
        i18n.changeLanguage(normalized);
      }
    } catch (error) {
      void error;
    }
  }, [i18n]);

  return (
    <Layout className="app-layout min-h-screen bg-transparent relative">
      {/* Mobile Header */}
      <Header className="mobile-header flex md:hidden items-center justify-between px-4 h-16 bg-glass border-b border-glass-border fixed w-full z-50">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={
              mobileDrawerOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />
            }
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          />
          <div className="flex items-center gap-2">
            <Logo width={24} height={24} />
            <span className="font-bold text-lg text-[var(--text-primary)]">
              {t('common.app_name')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={theme === 'light' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            className="theme-toggle-btn"
          />
          <Dropdown
            menu={{ items: languageMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<GlobalOutlined />}
              aria-label={t('common.language')}
              className="theme-toggle-btn"
            >
              {currentLanguage === 'zh-CN'
                ? t('common.lang_cn')
                : t('common.lang_en')}
            </Button>
          </Dropdown>
          <Dropdown
            menu={{ items: user ? userMenuItems : guestMenuItems }}
            placement="bottomRight"
            trigger={['click']}
            classNames={{ root: 'user-menu-dropdown' }}
          >
            <Avatar
              size={32}
              src={user?.avatar}
              icon={<UserOutlined />}
              className="cursor-pointer hover:scale-105 transition-transform duration-300 shadow-md"
            />
          </Dropdown>
        </div>
      </Header>

      {/* Desktop Header/Nav - For User Profile */}
      <Header className="hidden md:flex items-center justify-end px-6 bg-transparent border-none absolute right-0 top-0 z-50 h-16">
        <div className="flex items-center gap-4 relative">
          <Dropdown
            menu={{ items: languageMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<GlobalOutlined />}
              aria-label={t('common.language')}
              className="theme-toggle-btn"
            >
              {currentLanguage === 'zh-CN'
                ? t('common.lang_cn')
                : t('common.lang_en')}
            </Button>
          </Dropdown>
          <Button
            type="text"
            icon={theme === 'light' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            className="theme-toggle-btn"
          />
          <Dropdown
            menu={{ items: user ? userMenuItems : guestMenuItems }}
            placement="bottomRight"
            trigger={['click']}
            classNames={{ root: 'user-menu-dropdown' }}
          >
            <div className="flex items-center gap-2 cursor-pointer group">
              <Avatar
                size={40}
                src={user?.avatar}
                icon={<UserOutlined />}
                className="bg-primary/10 text-primary border border-primary/20 hover:scale-105 transition-transform duration-300 shadow-md"
              />
            </div>
          </Dropdown>
        </div>
      </Header>

      {/* Desktop Sidebar */}
      <Sider
        width={280}
        collapsedWidth={80}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        className="hidden md:block border-r border-glass-border h-screen fixed left-0 top-0 z-20"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'var(--glass-backdrop)',
        }}
      >
        <Sidebar
          isCollapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </Sider>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0, background: 'transparent' } }}
        size="default"
        closable={false}
      >
        <Sidebar
          isCollapsed={false}
          setMobileDrawerOpen={setMobileDrawerOpen}
        />
      </Drawer>

      {/* Main Content Area */}
      <Layout
        className={`transition-all duration-300 ease-in-out bg-transparent flex flex-col min-h-screen
          ${collapsed ? 'md:pl-[80px]' : 'md:pl-[280px]'}
          pt-16 md:pt-0
        `}
      >
        <Content className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in relative z-10">
          <Outlet />
        </Content>
      </Layout>

      <CookieConsent />
    </Layout>
  );
};

export default AppLayout;
