import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RocketOutlined } from '@ant-design/icons';

const GlobalQuotaListener: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setVisible(true);
    };

    window.addEventListener('app:quota_exceeded', handleQuotaExceeded as EventListener);

    return () => {
      window.removeEventListener('app:quota_exceeded', handleQuotaExceeded as EventListener);
    };
  }, []);

  const handleUpgrade = () => {
    setVisible(false);
    navigate('/pricing');
  };

  const handleCancel = () => {
    setVisible(false);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <RocketOutlined style={{ color: '#eb2f96' }} />
          <span>{t('quota.upgrade_title', 'Upgrade Your Plan')}</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {t('common.cancel', 'Cancel')}
        </Button>,
        <Button key="upgrade" type="primary" onClick={handleUpgrade} style={{ backgroundColor: '#eb2f96', borderColor: '#eb2f96' }}>
          {t('quota.upgrade_button', 'Upgrade Now')}
        </Button>,
      ]}
    >
      <p>
        {t(
          'quota.upgrade_message',
          'You have reached the limit of your current plan. Please upgrade to continue enjoying our premium features.'
        )}
      </p>
    </Modal>
  );
};

export default GlobalQuotaListener;
