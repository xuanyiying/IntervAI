"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _isNativeReflectConstruct2 = _interopRequireDefault(require("@babel/runtime/helpers/isNativeReflectConstruct"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var React = _interopRequireWildcard(require("react"));
var _Alert = _interopRequireDefault(require("./Alert"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2.default)(o), (0, _possibleConstructorReturn2.default)(t, (0, _isNativeReflectConstruct2.default)() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2.default)(t).constructor) : o.apply(t, e)); }
let ErrorBoundary = /*#__PURE__*/function (_React$Component) {
  function ErrorBoundary() {
    var _this;
    (0, _classCallCheck2.default)(this, ErrorBoundary);
    _this = _callSuper(this, ErrorBoundary, arguments);
    _this.state = {
      error: undefined,
      info: {
        componentStack: ''
      }
    };
    return _this;
  }
  (0, _inherits2.default)(ErrorBoundary, _React$Component);
  return (0, _createClass2.default)(ErrorBoundary, [{
    key: "componentDidCatch",
    value: function componentDidCatch(error, info) {
      this.setState({
        error,
        info
      });
    }
  }, {
    key: "render",
    value: function render() {
      const {
        message,
        title,
        description,
        id,
        children
      } = this.props;
      const {
        error,
        info
      } = this.state;
      const mergedTitle = title ?? message;
      const componentStack = info?.componentStack || null;
      const errorMessage = typeof mergedTitle === 'undefined' ? (error || '').toString() : mergedTitle;
      const errorDescription = typeof description === 'undefined' ? componentStack : description;
      if (error) {
        return /*#__PURE__*/React.createElement(_Alert.default, {
          id: id,
          type: "error",
          title: errorMessage,
          description: /*#__PURE__*/React.createElement("pre", {
            style: {
              fontSize: '0.9em',
              overflowX: 'auto'
            }
          }, errorDescription)
        });
      }
      return children;
    }
  }]);
}(React.Component);
var _default = exports.default = ErrorBoundary;