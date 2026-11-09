import React from 'react';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  style,
  width = 32,
  height = 32,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient
          id="logo_gradient_component"
          x1="0"
          y1="0"
          x2="512"
          y2="512"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect
        x="32"
        y="32"
        width="448"
        height="448"
        rx="112"
        fill="url(#logo_gradient_component)"
      />
      <path
        d="M374 150H138C117.013 150 100 167.013 100 188V300C100 320.987 117.013 338 138 338H180V390L250 338H374C394.987 338 412 320.987 412 300V188C412 167.013 394.987 150 374 150Z"
        fill="white"
      />
      <path
        d="M256 200C256 200 266 234 296 244C266 254 256 288 256 288C256 288 246 254 216 244C246 234 256 200 256 200Z"
        fill="url(#logo_gradient_component)"
      />
    </svg>
  );
};
