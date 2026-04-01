"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
var _hooks = require("../_util/hooks");
var _context = require("../config-provider/context");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Meta = props => {
  const {
    prefixCls: customizePrefixCls,
    className,
    avatar,
    title,
    description,
    style,
    classNames: cardMetaClassNames,
    styles,
    ...restProps
  } = props;
  const {
    getPrefixCls,
    className: contextClassName,
    style: contextStyle,
    classNames: contextClassNames,
    styles: contextStyles
  } = (0, _context.useComponentConfig)('cardMeta');
  const prefixCls = getPrefixCls('card', customizePrefixCls);
  const metaPrefixCls = `${prefixCls}-meta`;
  const [mergedClassNames, mergedStyles] = (0, _hooks.useMergeSemantic)([contextClassNames, cardMetaClassNames], [contextStyles, styles], {
    props
  });
  const rootClassNames = (0, _clsx.clsx)(metaPrefixCls, className, contextClassName, mergedClassNames.root);
  const rootStyles = {
    ...contextStyle,
    ...mergedStyles.root,
    ...style
  };
  const avatarClassNames = (0, _clsx.clsx)(`${metaPrefixCls}-avatar`, mergedClassNames.avatar);
  const titleClassNames = (0, _clsx.clsx)(`${metaPrefixCls}-title`, mergedClassNames.title);
  const descriptionClassNames = (0, _clsx.clsx)(`${metaPrefixCls}-description`, mergedClassNames.description);
  const sectionClassNames = (0, _clsx.clsx)(`${metaPrefixCls}-section`, mergedClassNames.section);
  const avatarDom = avatar ? (/*#__PURE__*/React.createElement("div", {
    className: avatarClassNames,
    style: mergedStyles.avatar
  }, avatar)) : null;
  const titleDom = title ? (/*#__PURE__*/React.createElement("div", {
    className: titleClassNames,
    style: mergedStyles.title
  }, title)) : null;
  const descriptionDom = description ? (/*#__PURE__*/React.createElement("div", {
    className: descriptionClassNames,
    style: mergedStyles.description
  }, description)) : null;
  const MetaDetail = titleDom || descriptionDom ? (/*#__PURE__*/React.createElement("div", {
    className: sectionClassNames,
    style: mergedStyles.section
  }, titleDom, descriptionDom)) : null;
  return /*#__PURE__*/React.createElement("div", {
    ...restProps,
    className: rootClassNames,
    style: rootStyles
  }, avatarDom, MetaDetail);
};
var _default = exports.default = Meta;