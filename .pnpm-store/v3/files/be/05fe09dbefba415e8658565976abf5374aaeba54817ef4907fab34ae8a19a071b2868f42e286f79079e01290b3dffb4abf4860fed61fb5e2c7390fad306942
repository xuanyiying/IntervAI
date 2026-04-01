"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useColor;
var React = _interopRequireWildcard(require("react"));
var _fastColor = require("@ant-design/fast-color");
var _colors = require("../../_util/colors");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * Convert color related props to a unified object,
 * which is used to flatten the compatibility requirements.
 */
function useColor(props, contextVariant) {
  const {
    color,
    variant,
    bordered
  } = props;
  return React.useMemo(() => {
    const isInverseColor = color?.endsWith('-inverse');
    // =================== Variant ===================
    let nextVariant;
    if (variant) {
      // `variant` first
      nextVariant = variant;
    } else if (isInverseColor) {
      // Fallback if using inverse color
      nextVariant = 'solid';
    } else if (bordered === false) {
      // Fallback if using filled
      nextVariant = 'filled';
    } else {
      // Finally not conflict, use context
      nextVariant = contextVariant || 'filled';
    }
    // ==================== Color ====================
    const nextColor = isInverseColor ? color?.replace('-inverse', '') : color;
    // =============== Preset & Status ===============
    const nextIsPreset = (0, _colors.isPresetColor)(color);
    const nextIsStatus = (0, _colors.isPresetStatusColor)(color);
    // ================== Customize ==================
    // When `color` is not preset color,
    // dynamic calculate the color pair.
    const tagStyle = {};
    if (!nextIsPreset && !nextIsStatus && nextColor) {
      if (nextVariant === 'solid') {
        tagStyle.backgroundColor = color;
      } else {
        const hsl = new _fastColor.FastColor(nextColor).toHsl();
        hsl.l = 0.95;
        tagStyle.backgroundColor = new _fastColor.FastColor(hsl).toHexString();
        tagStyle.color = color;
        if (nextVariant === 'outlined') {
          tagStyle.borderColor = color;
        }
      }
    }
    return [nextVariant, nextColor, nextIsPreset, nextIsStatus, tagStyle];
  }, [color, variant, bordered, contextVariant]);
}