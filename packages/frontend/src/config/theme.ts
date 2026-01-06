import type { ThemeConfig } from 'antd';
import { theme as antTheme } from 'antd';

export const theme: ThemeConfig = {
  algorithm: antTheme.darkAlgorithm,
  token: {
    colorPrimary: '#6366f1', // Indigo-500
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',

    // Backgrounds
    colorBgBase: '#0f172a', // Slate 900
    colorBgContainer: '#1e293b', // Slate 800
    colorBgElevated: '#1e293b',

    // Text
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#64748b',

    // Borders
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,
    colorBorder: 'rgba(255, 255, 255, 0.08)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.05)',

    // Typography
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      bodyBg: '#0f172a',
      headerBg: 'rgba(15, 23, 42, 0.7)', // Semi-transparent
      headerPadding: '0 24px',
      siderBg: '#0f172a',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#94a3b8',
      itemSelectedColor: '#fff',
      itemSelectedBg: 'rgba(99, 102, 241, 0.15)', // Primary with opacity
      itemHoverBg: 'rgba(255, 255, 255, 0.05)',
      // Remove border from active menu item
      activeBarBorderWidth: 0,
      activeBarHeight: 0,
    },
    Button: {
      primaryShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.3)',
      defaultBg: 'rgba(255, 255, 255, 0.02)',
      defaultBorderColor: 'rgba(255, 255, 255, 0.08)',
      defaultColor: '#f8fafc',
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.02)',
      activeBorderColor: '#6366f1',
      hoverBorderColor: '#818cf8',
    },
    Card: {
      colorBgContainer: 'rgba(30, 41, 59, 0.4)', // Very transparent slate
      colorBorderSecondary: 'rgba(255, 255, 255, 0.05)',
    },
    Modal: {
      contentBg: '#1e293b',
      headerBg: '#1e293b',
    },
    Drawer: {
      colorBgElevated: '#0f172a',
    },
    Table: {
      colorBgContainer: 'transparent',
      headerBg: 'rgba(255, 255, 255, 0.02)',
      rowHoverBg: 'rgba(255, 255, 255, 0.03)',
    },
  },
};
