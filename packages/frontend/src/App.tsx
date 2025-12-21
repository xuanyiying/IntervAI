import React from 'react';
import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';
import { theme } from './config/theme';
import { useTranslation } from 'react-i18next';
import enUS from 'antd/locale/en_US';

function App() {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language.startsWith('en') ? enUS : zhCN;

  return (
    <ConfigProvider locale={currentLocale} theme={theme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
