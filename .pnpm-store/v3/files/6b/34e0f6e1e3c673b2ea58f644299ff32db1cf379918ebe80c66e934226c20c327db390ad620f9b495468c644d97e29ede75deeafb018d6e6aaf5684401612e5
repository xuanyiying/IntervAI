"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const EMPTY_KEYS = [];
function filterKeys(keys, dataKeys) {
  const filteredKeys = keys.filter(key => dataKeys.has(key));
  return keys.length === filteredKeys.length ? keys : filteredKeys;
}
function flattenKeys(keys) {
  return Array.from(keys).join(';');
}
function useSelection(leftDataSource, rightDataSource, selectedKeys) {
  // Prepare `dataSource` keys
  const [leftKeys, rightKeys] = React.useMemo(() => [new Set(leftDataSource.map(src => src?.key)), new Set(rightDataSource.map(src => src?.key))], [leftDataSource, rightDataSource]);
  // Selected Keys
  const [mergedSelectedKeys, setMergedSelectedKeys] = (0, _util.useControlledState)(EMPTY_KEYS, selectedKeys);
  const sourceSelectedKeys = React.useMemo(() => filterKeys(mergedSelectedKeys, leftKeys), [mergedSelectedKeys, leftKeys]);
  const targetSelectedKeys = React.useMemo(() => filterKeys(mergedSelectedKeys, rightKeys), [mergedSelectedKeys, rightKeys]);
  // // Reset when data changed
  React.useEffect(() => {
    setMergedSelectedKeys([].concat((0, _toConsumableArray2.default)(filterKeys(mergedSelectedKeys, leftKeys)), (0, _toConsumableArray2.default)(filterKeys(mergedSelectedKeys, rightKeys))));
  }, [flattenKeys(leftKeys), flattenKeys(rightKeys)]);
  // Update keys
  const setSourceSelectedKeys = (0, _util.useEvent)(nextSrcKeys => {
    setMergedSelectedKeys([].concat((0, _toConsumableArray2.default)(nextSrcKeys), (0, _toConsumableArray2.default)(targetSelectedKeys)));
  });
  const setTargetSelectedKeys = (0, _util.useEvent)(nextTargetKeys => {
    setMergedSelectedKeys([].concat((0, _toConsumableArray2.default)(sourceSelectedKeys), (0, _toConsumableArray2.default)(nextTargetKeys)));
  });
  return [
  // Keys
  sourceSelectedKeys, targetSelectedKeys,
  // Updater
  setSourceSelectedKeys, setTargetSelectedKeys];
}
var _default = exports.default = useSelection;