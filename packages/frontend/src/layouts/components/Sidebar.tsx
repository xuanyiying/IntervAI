import React from 'react';
import { Button, Input, Tooltip, Badge, Modal } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined,
  DashboardOutlined,
  TeamOutlined,
  ApiOutlined,
  FileTextOutlined,
  BarcodeOutlined,
  ToolOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DollarOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useConversationStore } from '@/stores';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';

// Interface for props if needed, though we use stores mostly
interface SidebarProps {
  isCollapsed: boolean;
  setMobileDrawerOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setMobileDrawerOpen,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const {
    conversations,
    currentConversation,
    deleteConversation,
    createConversation,
    setCurrentConversation,
    switchConversation,
  } = useConversationStore();

  const [searchText, setSearchText] = React.useState('');

  const isAdmin = user?.role === 'ADMIN';

  const filteredConversations = React.useMemo(() => {
    if (!searchText.trim()) return conversations;
    return conversations.filter((c) =>
      c.title?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [conversations, searchText]);

  const handleNewChat = async () => {
    try {
      const conversation = await createConversation();
      navigate('/chat');
      setCurrentConversation(conversation);
      if (setMobileDrawerOpen) setMobileDrawerOpen(false);
    } catch {
      // Error handling is managed by store or global message usually,
      // but simplistic here for brevity as per original
    }
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: t('common.delete'),
      content: t('common.delete_confirm'),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        await deleteConversation(chatId);
        if (currentConversation?.id === chatId) {
          navigate('/chat');
        }
      },
    });
  };

  const handleSelectChat = async (chatId: string) => {
    if (currentConversation?.id === chatId) return;
    await switchConversation(chatId);
    if (setMobileDrawerOpen) setMobileDrawerOpen(false);
    navigate('/chat');
  };

  const handleLogout = () => {
    Modal.confirm({
      title: t('menu.logout'),
      content: t('auth.logout_confirm'),
      onOk: () => {
        clearAuth();
        navigate('/login');
      },
    });
  };

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

  return (
    <div
      className={`sidebar-wrapper ${isCollapsed ? 'collapsed' : ''}`}
      style={{ background: 'transparent' }}
    >
      {/* Brand */}
      <div className="sidebar-brand h-16 flex items-center px-4">
        {!isCollapsed && (
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-secondary-400">
            {t('common.app_name')}
          </span>
        )}
      </div>

      {/* New Chat */}
      <div className="px-4 mb-4">
        <Tooltip
          title={isCollapsed ? t('menu.new_chat') : ''}
          placement="right"
        >
          <button
            onClick={handleNewChat}
            className={`w-full gradient-button flex items-center justify-center gap-2 ${isCollapsed ? 'p-2' : ''}`}
          >
            <PlusOutlined />
            {!isCollapsed && <span>{t('menu.new_chat')}</span>}
          </button>
        </Tooltip>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-4 mb-4">
          <Input
            placeholder={`${t('common.search')}... (⌘K)`}
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="glass-input border-none bg-white/5 text-white"
            allowClear
          />
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide">
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider flex justify-between items-center">
            {t('menu.history')}
            <Badge
              count={filteredConversations.length}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#999',
                boxShadow: 'none',
              }}
            />
          </div>
        )}

        {filteredConversations.map((item) => (
          <Tooltip
            key={item.id}
            title={isCollapsed ? item.title || t('menu.new_chat') : ''}
            placement="right"
          >
            <div
              onClick={() => handleSelectChat(item.id)}
              className={`
                group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
                ${
                  currentConversation?.id === item.id
                    ? 'bg-primary-500/10 text-primary-300 border border-primary-500/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }
              `}
            >
              <MessageOutlined />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {item.title || t('menu.new_chat')}
                  </div>
                </div>
              )}
              {/* Actions (visible on hover) */}
              {!isCollapsed && (
                <div
                  className={`flex gap-1 ${currentConversation?.id === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    className="text-gray-400 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation(); /* Rename logic */
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    className="hover:bg-red-500/20"
                    onClick={(e) => handleDeleteChat(item.id, e)}
                  />
                </div>
              )}
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Admin Links */}
      {isAdmin && !isCollapsed && (
        <div className="mt-4 px-2 pb-2 border-t border-white/10">
          <div className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">
            {t('menu.admin')}
          </div>
          {adminNavItems.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                navigate(item.path);
                if (setMobileDrawerOpen) setMobileDrawerOpen(false);
              }}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm mb-1 transition-colors
                ${location.pathname.startsWith(item.path) ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-white/10 mt-auto">
        <Dropdown
          menu={{ items: userMenu }}
          placement="topLeft"
          trigger={['click']}
        >
          <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user?.username?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              {isAdmin && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-gray-900" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user?.username || 'User'}
                </div>
                {isAdmin && (
                  <div className="text-xs text-primary-400">Administrator</div>
                )}
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default Sidebar;
