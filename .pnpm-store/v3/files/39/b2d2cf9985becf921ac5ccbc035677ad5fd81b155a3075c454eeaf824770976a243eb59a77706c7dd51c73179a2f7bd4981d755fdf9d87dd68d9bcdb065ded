"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useForm;
exports.toNamePathStr = toNamePathStr;
var React = _interopRequireWildcard(require("react"));
var _form = require("@rc-component/form");
var _findDOMNode = require("@rc-component/util/lib/Dom/findDOMNode");
var _scrollIntoViewIfNeeded = _interopRequireDefault(require("scroll-into-view-if-needed"));
var _util = require("../util");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function toNamePathStr(name) {
  const namePath = (0, _util.toArray)(name);
  return namePath.join('_');
}
function getFieldDOMNode(name, wrapForm) {
  const field = wrapForm.getFieldInstance(name);
  const fieldDom = (0, _findDOMNode.getDOM)(field);
  if (fieldDom) {
    return fieldDom;
  }
  const fieldId = (0, _util.getFieldId)((0, _util.toArray)(name), wrapForm.__INTERNAL__.name);
  if (fieldId) {
    return document.getElementById(fieldId);
  }
}
function useForm(form) {
  const [rcForm] = (0, _form.useForm)();
  const itemsRef = React.useRef({});
  const wrapForm = React.useMemo(() => form ?? {
    ...rcForm,
    __INTERNAL__: {
      itemRef: name => node => {
        const namePathStr = toNamePathStr(name);
        if (node) {
          itemsRef.current[namePathStr] = node;
        } else {
          delete itemsRef.current[namePathStr];
        }
      }
    },
    scrollToField: (name, options = {}) => {
      const {
        focus,
        ...restOpt
      } = options;
      const node = getFieldDOMNode(name, wrapForm);
      if (node) {
        (0, _scrollIntoViewIfNeeded.default)(node, {
          scrollMode: 'if-needed',
          block: 'nearest',
          ...restOpt
        });
        // Focus if scroll success
        if (focus) {
          wrapForm.focusField(name);
        }
      }
    },
    focusField: name => {
      const itemRef = wrapForm.getFieldInstance(name);
      if (typeof itemRef?.focus === 'function') {
        itemRef.focus();
      } else {
        getFieldDOMNode(name, wrapForm)?.focus?.();
      }
    },
    getFieldInstance: name => {
      const namePathStr = toNamePathStr(name);
      return itemsRef.current[namePathStr];
    }
  }, [form, rcForm]);
  return [wrapForm];
}