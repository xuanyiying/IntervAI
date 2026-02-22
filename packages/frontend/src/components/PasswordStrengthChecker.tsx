import React from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface PasswordStrengthCheckerProps {
  password?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export const PasswordStrengthChecker: React.FC<
  PasswordStrengthCheckerProps
> = ({ password = '', onValidationChange }) => {
  const { t } = useTranslation();

  const rules = [
    {
      id: 'length',
      label: t('auth.password_rule_length', 'At least 8 characters'),
      validator: (pwd: string) => pwd.length >= 8,
    },
    {
      id: 'uppercase',
      label: t('auth.password_rule_uppercase', 'At least one uppercase letter'),
      validator: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      id: 'lowercase',
      label: t('auth.password_rule_lowercase', 'At least one lowercase letter'),
      validator: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      id: 'number',
      label: t('auth.password_rule_number', 'At least one number'),
      validator: (pwd: string) => /\d/.test(pwd),
    },
    {
      id: 'special',
      label: t(
        'auth.password_rule_special',
        'At least one special character (!@#$%^&*)'
      ),
      validator: (pwd: string) => /[!@#$%^&*]/.test(pwd),
    },
  ];

  const results = rules.map((rule) => ({
    ...rule,
    isValid: rule.validator(password),
  }));

  const allValid = results.every((r) => r.isValid);

  React.useEffect(() => {
    onValidationChange?.(allValid);
  }, [allValid, onValidationChange]);

  if (!password) {
    return null;
  }

  return (
    <div
      className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10"
      role="alert"
      aria-live="polite"
    >
      <div className="text-sm font-medium mb-2 text-gray-300">
        {t('auth.password_requirements', 'Password Requirements:')}
      </div>
      <ul className="space-y-1 pl-0 list-none m-0">
        {results.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center text-xs ${
              rule.isValid ? 'text-green-400' : 'text-gray-400'
            }`}
            aria-label={`${rule.label}: ${
              rule.isValid ? 'Passed' : 'Not passed'
            }`}
          >
            <span className="mr-2 flex items-center">
              {rule.isValid ? <CheckOutlined /> : <CloseOutlined />}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
