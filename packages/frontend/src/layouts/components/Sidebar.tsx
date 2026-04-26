import { Logo } from '@/components/Logo';
import { useAuthStore, useConversationStore, useResumeStore } from '@/stores';
import { Role } from '@/types';
import { Button, Badge, Input, Modal, useToast } from '@/components/ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const IconHome: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconFileSearch: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconRobot: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/>
    <line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

const IconUser: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconStar: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconChart: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const IconMenuFold: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconMenuUnfold: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconMessage: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconPlus: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSearch: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconEdit: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconDelete: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconDashboard: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconTeam: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconApi: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconFileText: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconBarcode: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 5v14"/>
    <path d="M8 5v14"/>
    <path d="M12 5v14"/>
    <path d="M17 5v14"/>
    <path d="M21 5v14"/>
  </svg>
);

const IconTool: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconWallet: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
  </svg>
);

const IconX: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
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
  const { success, error: showError } = useToast();
  const {
    conversations,
    currentConversation,
    deleteConversation,
    createConversation,
    setCurrentConversation,
    switchConversation,
  } = useConversationStore();

  const [searchText, setSearchText] = React.useState('');
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [chatIdToDelete, setChatIdToDelete] = React.useState<string | null>(null);

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
      key: 'mock-interview',
      icon: <IconUser />,
      label: t('menu.mock_interview', '模拟面试'),
      path: '/role-play',
    },
    {
      key: 'pitch-perfect',
      icon: <IconStar />,
      label: t('menu.pitch_perfect', '自我介绍'),
      path: '/pitch-perfect',
    },
    {
      key: 'interview-prediction',
      icon: <IconChart />,
      label: t('menu.interview_prediction', '面试押题'),
      path: '/strategist',
    },
    {
      key: 'chat',
      icon: <IconMessage />,
      label: t('menu.chat', '对话'),
      path: '/chat',
    },
    ...(IS_EE ? [
      {
        key: 'pricing',
        icon: <IconWallet />,
        label: t('menu.pricing', '订阅与定价'),
        path: '/pricing',
      },
    ] : []),
  ];

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
      showError('创建对话失败');
    }
  };

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatIdToDelete(chatId);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatIdToDelete) return;
    try {
      const { conversations: currentList, currentConversation: current } =
        useConversationStore.getState();
      const isDeletingCurrent = current?.id === chatIdToDelete;
      let nextId: string | null = null;

      if (isDeletingCurrent) {
        const currentIndex = currentList.findIndex((c) => c.id === chatIdToDelete);
        const nextConvo =
          currentList[currentIndex + 1] || currentList[currentIndex - 1];
        if (nextConvo) {
          nextId = nextConvo.id;
        }
      }

      await deleteConversation(chatIdToDelete);
      success('对话已删除');

      if (isDeletingCurrent) {
        navigate('/chat');
        if (nextId) {
          await switchConversation(nextId);
        } else {
          setCurrentConversation(null);
        }
      }
    } catch {
      showError('删除失败');
    } finally {
      setDeleteModalVisible(false);
      setChatIdToDelete(null);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (setMobileDrawerOpen) setMobileDrawerOpen(false);

    if (currentConversation?.id === chatId) {
      navigate('/chat');
      return;
    }

    try {
      navigate('/chat');
      await switchConversation(chatId);
    } catch {
      showError('切换对话失败');
    }
  };

  const adminNavItems = [
    {
      key: 'dashboard',
      icon: <IconDashboard />,
      label: t('menu.dashboard', '控制台'),
      path: '/admin/dashboard',
    },
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
    ...(IS_EE ? [
      {
        key: 'invite-codes',
        icon: <IconBarcode />,
        label: t('menu.invite_code_management'),
        path: '/admin/invite-codes',
      },
    ] : []),
    {
      key: 'knowledge-base',
      icon: <IconFileText />,
      label: t('menu.knowledge_base', '知识库'),
      path: '/admin/knowledge-base',
    },
    {
      key: 'system-settings',
      icon: <IconTool />,
      label: t('menu.system_settings'),
      path: '/admin/system-settings',
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
            {isCollapsed ? <IconMenuUnfold size={20} /> : <IconMenuFold size={20} />}
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
              <span className="truncate text-sm font-medium">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--glass-border)] mt-2 pt-2" />

      <div className="px-4 mb-4">
        <button
          onClick={handleNewChat}
          className={`w-full gradient-button flex items-center justify-center gap-2 ${isCollapsed ? 'p-2' : ''}`}
          title={isCollapsed ? t('menu.new_chat') : ''}
        >
          <IconPlus size={18} />
          {!isCollapsed && <span>{t('menu.new_chat')}</span>}
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-4 mb-4">
          <Input
            placeholder={`${t('common.search')}... (⌘K)`}
            prefix={<IconSearch size={16} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide">
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex justify-between items-center">
            {t('menu.history')}
            <Badge variant="default">
              {filteredConversations.length}
            </Badge>
          </div>
        )}

        {filteredConversations.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelectChat(item.id)}
            className={`
              group flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200 relative
              ${currentConversation?.id === item.id ? 'text-primary-500 shadow-sm' : 'text-[var(--text-secondary)]'}
            `}
            style={{
              paddingLeft: 'var(--sidebar-item-padding-x)',
              paddingRight: 'var(--sidebar-item-padding-x)',
              paddingTop: 'var(--sidebar-item-padding-y)',
              paddingBottom: 'var(--sidebar-item-padding-y)',
              marginTop: 'var(--sidebar-item-margin-y)',
              marginBottom: 'var(--sidebar-item-margin-y)',
              backgroundColor:
                currentConversation?.id === item.id
                  ? 'var(--sidebar-item-active)'
                  : 'transparent',
            }}
            title={isCollapsed ? item.title || t('menu.new_chat') : ''}
          >
            <IconMessage size={18} />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">
                  {item.title || t('menu.new_chat')}
                </div>
              </div>
            )}
            {!isCollapsed && (
              <div
                className={`flex gap-1 ${currentConversation?.id === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <button
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="重命名"
                >
                  <IconEdit size={14} />
                </button>
                <button
                  className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                  onClick={(e) => handleDeleteClick(item.id, e)}
                  title="删除"
                >
                  <IconDelete size={14} />
                </button>
              </div>
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

      <Modal
        open={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title={t('common.delete', '删除')}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalVisible(false)}>
              {t('common.cancel', '取消')}
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              {t('common.delete', '删除')}
            </Button>
          </div>
        }
      >
        <p className="text-[var(--text-secondary)]">
          {t('common.delete_confirm', '确定要删除这个对话吗？此操作无法撤销。')}
        </p>
      </Modal>
    </div>
  );
};

export default Sidebar;