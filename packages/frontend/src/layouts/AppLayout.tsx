import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout,
  Avatar,
  Dropdown,
  Button,
  theme,
  Modal,
  Tooltip,
  Drawer,
  message,
  Input,
  Badge,
} from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DollarOutlined,
  PlusOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  FileTextOutlined,
  BarcodeOutlined,
  TeamOutlined,
  ToolOutlined,
  GlobalOutlined,
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores';
import { useConversationStore } from '@/stores';
import CookieConsent from '../components/CookieConsent';
import { useTranslation } from 'react-i18next';
import './AppLayout.css';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { user, clearAuth } = useAuthStore();
  const {
    conversations,
    currentConversation,
    deleteConversation,
    loadConversations,
    createConversation,
    setCurrentConversation,
    switchConversation,
  } = useConversationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const {
    token: { colorBgContainer, colorBorderSecondary, colorPrimary },
  } = theme.useToken();

  // 判断是否为管理员
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  // 过滤对话列表
  const filteredConversations = useMemo(() => {
    if (!searchText.trim()) return conversations;
    return conversations.filter((c) =>
      c.title?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [conversations, searchText]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('chat-search-input')?.focus();
      }
      // Cmd/Ctrl + N 新建对话
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: t('menu.logout'),
      content: t('auth.logout_confirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => {
        clearAuth();
        navigate('/login');
      },
    });
  }, [t, clearAuth, navigate]);

  const handleNewChat = useCallback(async () => {
    try {
      const conversation = await createConversation();
      navigate('/chat');
      setCurrentConversation(conversation);
      setMobileDrawerOpen(false);
    } catch {
      message.error(t('chat.create_failed', '创建新对话失败'));
    }
  }, [createConversation, navigate, setCurrentConversation, t]);

  const handleDeleteChat = useCallback(
    (chatId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      Modal.confirm({
        title: t('common.delete'),
        content: t('common.delete_confirm'),
        okText: t('common.delete'),
        okType: 'danger',
        cancelText: t('common.cancel'),
        onOk: async () => {
          const hide = message.loading(t('common.loading'), 0);
          try {
            await deleteConversation(chatId);
            hide();
            message.success(t('common.success'));
            if (currentConversation?.id === chatId) {
              navigate('/chat');
            }
          } catch {
            hide();
            message.error(t('common.error'));
          }
        },
      });
    },
    [t, deleteConversation, currentConversation?.id, navigate]
  );

  const handleSelectChat = useCallback(
    async (chatId: string) => {
      if (currentConversation?.id === chatId) return;
      try {
        await switchConversation(chatId);
        setMobileDrawerOpen(false);
        navigate('/chat');
      } catch {
        message.error(t('chat.switch_failed', '切换对话失败'));
      }
    },
    [currentConversation?.id, switchConversation, navigate, t]
  );

  // 检查当前路径是否为管理页面
  const isAdminPage = location.pathname.startsWith('/admin');

  // User dropdown menu - 普通用户菜单
  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      label: t('menu.profile'),
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('menu.settings'),
      onClick: () => navigate('/settings'),
    },
    {
      key: 'pricing',
      icon: <DollarOutlined />,
      label: t('menu.pricing'),
      onClick: () => navigate('/pricing'),
    },
    { type: 'divider' },
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

  // 管理员导航项
  const adminNavItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('menu.dashboard', '控制台'),
      path: '/admin/dashboard',
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: t('menu.user_management'),
      path: '/admin/users',
    },
    {
      key: 'models',
      icon: <ApiOutlined />,
      label: t('menu.model_management'),
      path: '/admin/models',
    },
    {
      key: 'prompts',
      icon: <FileTextOutlined />,
      label: t('menu.prompt_management'),
      path: '/admin/prompts',
    },
    {
      key: 'invite-codes',
      icon: <BarcodeOutlined />,
      label: t('menu.invite_code_management'),
      path: '/admin/invite-codes',
    },
    {
      key: 'system-settings',
      icon: <ToolOutlined />,
      label: t('menu.system_settings'),
      path: '/admin/system-settings',
    },
  ];

  // Sidebar content component (shared between desktop and mobile)
  const SidebarContent = ({
    isCollapsed = false,
  }: {
    isCollapsed?: boolean;
  }) => (
    <div className={`sidebar-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Logo & Brand */}
      <div className="sidebar-brand">
        {!isCollapsed && (
          <span className="brand-text">{t('common.app_name')}</span>
        )}
      </div>

      {/* New Chat Button */}
      <div className="sidebar-header">
        <Tooltip
          title={isCollapsed ? t('menu.new_chat') : ''}
          placement="right"
        >
          <Button
            type="primary"
            block
            icon={<PlusOutlined />}
            onClick={handleNewChat}
            className="new-chat-btn"
          >
            {!isCollapsed && t('menu.new_chat')}
          </Button>
        </Tooltip>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="sidebar-search">
          <Input
            id="chat-search-input"
            placeholder={`${t('common.search', '搜索')}... (⌘K)`}
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
      )}

      {/* History List */}
      <div className="sidebar-content">
        {!isCollapsed && (
          <div className="section-title">
            {t('menu.history')}
            <Badge
              count={filteredConversations.length}
              style={{ backgroundColor: '#f0f0f0', color: '#666' }}
            />
          </div>
        )}
        <div className="chat-list">
          {filteredConversations.map((item) => (
            <Tooltip
              key={item.id}
              title={isCollapsed ? item.title || t('menu.new_chat') : ''}
              placement="right"
            >
              <div
                onClick={() => handleSelectChat(item.id)}
                className={`chat-item ${currentConversation?.id === item.id ? 'active' : ''}`}
              >
                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <MessageOutlined className="chat-icon" />
                    {!isCollapsed && (
                      <span className="chat-title">
                        {item.title || t('menu.new_chat')}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="chat-date">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="chat-actions">
                    <Tooltip title={t('common.edit')}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement rename
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => handleDeleteChat(item.id, e)}
                      />
                    </Tooltip>
                  </div>
                )}
              </div>
            </Tooltip>
          ))}
          {filteredConversations.length === 0 && !isCollapsed && (
            <div className="empty-list">
              {searchText
                ? t('common.no_results', '无搜索结果')
                : t('chat.no_history', '暂无对话记录')}
            </div>
          )}
        </div>
      </div>

      {/* Admin Section - 仅管理员可见 */}
      {isAdmin && !isCollapsed && (
        <div className="admin-section">
          <div className="section-title">{t('menu.admin', '管理')}</div>
          <div className="admin-nav-list">
            {adminNavItems.map((item) => (
              <div
                key={item.key}
                className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setMobileDrawerOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Profile */}
      <div
        className="sidebar-footer"
        style={{ borderTop: `1px solid ${colorBorderSecondary}` }}
      >
        <Dropdown
          menu={{ items: userMenu }}
          placement="topLeft"
          trigger={['click']}
        >
          <div className="user-profile">
            <Badge dot={isAdmin} color={colorPrimary} offset={[-4, 4]}>
              <Avatar icon={<UserOutlined />} src={user?.avatar} />
            </Badge>
            {!isCollapsed && (
              <div className="user-info">
                <div className="user-name">{user?.username || 'User'}</div>
                {isAdmin && (
                  <div className="user-role">{t('menu.admin', '管理员')}</div>
                )}
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </div>
  );

  return (
    <Layout className="app-layout" style={{ background: colorBgContainer }}>
      {/* Mobile Header - only visible on mobile */}
      <Header
        className="mobile-header"
        style={{
          background: colorBgContainer,
          borderBottom: `1px solid ${colorBorderSecondary}`,
        }}
      >
        <Button
          type="text"
          icon={
            mobileDrawerOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />
          }
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="menu-toggle-btn"
        />
        <div className="header-title">{t('common.app_name')}</div>
        <Dropdown
          menu={{ items: userMenu }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Badge dot={isAdmin} color={colorPrimary} offset={[-4, 4]}>
            <Avatar
              size="default"
              icon={<UserOutlined />}
              src={user?.avatar}
              style={{ cursor: 'pointer' }}
            />
          </Badge>
        </Dropdown>
      </Header>

      {/* Desktop Sidebar */}
      <Sider
        className="desktop-sider"
        width={collapsed ? 72 : 260}
        collapsedWidth={72}
        collapsed={collapsed}
        theme="light"
        style={{
          borderRight: `1px solid ${colorBorderSecondary}`,
        }}
      >
        <SidebarContent isCollapsed={collapsed} />
        {/* Collapse Toggle */}
        <Button
          type="text"
          icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          className="collapse-btn"
        />
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        className="mobile-drawer"
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0 } }}
        width={280}
      >
        <div className="drawer-content">
          <SidebarContent />
        </div>
      </Drawer>

      <Layout style={{ background: 'transparent' }}>
        <Content className={`main-content ${isAdminPage ? 'admin-page' : ''}`}>
          <Outlet />
        </Content>
      </Layout>
      <CookieConsent />
    </Layout>
  );
};

export default AppLayout;
