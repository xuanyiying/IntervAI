"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.genCollapseMotion = void 0;
const genCollapseMotion = token => ({
  [token.componentCls]: {
    [`${token.antCls}-motion-collapse-legacy`]: {
      overflow: 'hidden',
      '&-active': {
        transition: `height ${token.motionDurationMid} ${token.motionEaseInOut},
        opacity ${token.motionDurationMid} ${token.motionEaseInOut} !important`
      }
    },
    [`${token.antCls}-motion-collapse`]: {
      overflow: 'hidden',
      transition: `height ${token.motionDurationMid} ${token.motionEaseInOut},
        opacity ${token.motionDurationMid} ${token.motionEaseInOut} !important`
    }
  }
});
exports.genCollapseMotion = genCollapseMotion;