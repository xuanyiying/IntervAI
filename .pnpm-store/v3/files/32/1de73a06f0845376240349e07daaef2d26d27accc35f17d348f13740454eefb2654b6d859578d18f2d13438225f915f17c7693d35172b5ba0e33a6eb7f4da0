"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _context = require("./context");
var _ErrorList = _interopRequireDefault(require("./ErrorList"));
var _Form = _interopRequireWildcard(require("./Form"));
var _FormItem = _interopRequireDefault(require("./FormItem"));
var _FormList = _interopRequireDefault(require("./FormList"));
var _useFormInstance = _interopRequireDefault(require("./hooks/useFormInstance"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Form = _Form.default;
Form.Item = _FormItem.default;
Form.List = _FormList.default;
Form.ErrorList = _ErrorList.default;
Form.useForm = _Form.useForm;
Form.useFormInstance = _useFormInstance.default;
Form.useWatch = _Form.useWatch;
Form.Provider = _context.FormProvider;
var _default = exports.default = Form;