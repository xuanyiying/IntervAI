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
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useAuthStore, useUIStore } from '@/stores';
import CookieConsent from '../components/CookieConsent';
import Sidebar from './components/Sidebar';
import { useTranslation } from 'react-i18next';
import './AppLayout.css';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

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
      key: 'pricing',
      label: t('menu.pricing'),
      icon: <DollarOutlined />,
      onClick: () => navigate('/pricing'),
    },
    {
      key: 'theme',
      icon: theme === 'light' ? <MoonOutlined /> : <SunOutlined />,
      label:
        theme === 'light'
          ? t('menu.dark_mode', '深色模式')
          : t('menu.light_mode', '浅色模式'),
      onClick: toggleTheme,
    },
    {
      key: 'lang',
      label: t('common.language'),
      icon: <GlobalOutlined />,
      children: [
        {
          key: 'zh-CN',
          label: '简体中文',
          onClick: () => i18n.changeLanguage('zh-CN'),
        },
        {
          key: 'en-US',
          label: 'English',
          onClick: () => i18n.changeLanguage('en-US'),
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
          <span className="font-bold text-lg text-[var(--text-primary)]">
            {t('common.app_name')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Dropdown
            menu={{ items: userMenuItems }}
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
            menu={{ items: userMenuItems }}
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
