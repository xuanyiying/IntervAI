import React from 'react';
import './Typography.css';

interface TypographyProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  type?: 'primary' | 'secondary' | 'secondary' | 'danger' | 'success' | 'warning';
  strong?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  as: Component = 'p',
  level,
  type,
  strong = false,
  className = '',
  style,
}) => {
  const getClassName = () => {
    const classes = ['glass-typography'];
    if (type) classes.push(`glass-typography-${type}`);
    if (strong) classes.push('glass-typography-strong');
    if (className) classes.push(className);
    return classes.join(' ');
  };

  const Tag = level ? `h${level}` as keyof JSX.IntrinsicElements : Component;

  return (
    <Tag className={getClassName()} style={style}>
      {children}
    </Tag>
  );
};

export const Title: React.FC<TypographyProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }> = ({
  children,
  level = 3,
  className = '',
  ...props
}) => {
  return (
    <Typography as={`h${level}`} level={level} className={className} {...props}>
      {children}
    </Typography>
  );
};

export const Text: React.FC<TypographyProps> = ({ children, className = '', ...props }) => {
  return (
    <Typography as="span" className={className} {...props}>
      {children}
    </Typography>
  );
};

export const Paragraph: React.FC<TypographyProps> = ({ children, className = '', ...props }) => {
  return (
    <Typography as="p" className={className} {...props}>
      {children}
    </Typography>
  );
};

export default Typography;