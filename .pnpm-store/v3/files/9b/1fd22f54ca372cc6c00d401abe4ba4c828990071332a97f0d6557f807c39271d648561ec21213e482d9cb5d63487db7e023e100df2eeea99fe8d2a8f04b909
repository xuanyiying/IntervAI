"use client";

import * as React from 'react';
import { clsx } from 'clsx';
import { ConfigContext } from '../config-provider';
const Grid = ({
  prefixCls,
  className,
  hoverable = true,
  ...props
}) => {
  const {
    getPrefixCls
  } = React.useContext(ConfigContext);
  const prefix = getPrefixCls('card', prefixCls);
  const classString = clsx(`${prefix}-grid`, className, {
    [`${prefix}-grid-hoverable`]: hoverable
  });
  return /*#__PURE__*/React.createElement("div", {
    ...props,
    className: classString
  });
};
export default Grid;