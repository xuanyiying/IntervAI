"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = usePositions;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var React = _interopRequireWildcard(require("react"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// Disabled the rule since `fill` is safe here
// but `Array.from` will increase bundle size.
/* eslint-disable unicorn/no-new-array */

/**
 * Auto arrange the items in the masonry layout.
 * Always get stable positions by order
 * instead of dynamic adjust for next item height.
 */
function usePositions(itemHeights, columnCount, verticalGutter) {
  // ==================== Auto Order ====================
  const [orderItemPositions, orderTotalHeight] = React.useMemo(() => {
    const columnHeights = new Array(columnCount).fill(0);
    const itemPositions = new Map();
    for (let i = 0; i < itemHeights.length; i += 1) {
      const [itemKey, itemHeight, itemColumn] = itemHeights[i];
      let targetColumnIndex = itemColumn ?? columnHeights.indexOf(Math.min.apply(Math, (0, _toConsumableArray2.default)(columnHeights)));
      targetColumnIndex = Math.min(targetColumnIndex, columnCount - 1);
      const top = columnHeights[targetColumnIndex];
      itemPositions.set(itemKey, {
        column: targetColumnIndex,
        top
      });
      columnHeights[targetColumnIndex] += itemHeight + verticalGutter;
    }
    return [itemPositions, Math.max(0, Math.max.apply(Math, (0, _toConsumableArray2.default)(columnHeights)) - verticalGutter)];
  }, [columnCount, itemHeights, verticalGutter]);
  // ====================== Return ======================
  return [orderItemPositions, orderTotalHeight];
}