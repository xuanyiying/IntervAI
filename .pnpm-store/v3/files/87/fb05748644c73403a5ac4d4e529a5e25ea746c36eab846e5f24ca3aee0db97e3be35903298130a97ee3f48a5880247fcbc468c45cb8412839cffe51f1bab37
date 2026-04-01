"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = RecordingIcon;
var _react = _interopRequireDefault(require("react"));
var _locale = require("../../../locale");
var _en_US = _interopRequireDefault(require("../../../locale/en_US"));
const SIZE = 1000;
const COUNT = 4;
const RECT_WIDTH = 140;
const RECT_RADIUS = RECT_WIDTH / 2;
const RECT_HEIGHT_MIN = 250;
const RECT_HEIGHT_MAX = 500;
const DURATION = 0.8;
function RecordingIcon({
  className
}) {
  const [contextLocale] = (0, _locale.useLocale)('Sender', _en_US.default.Sender);
  return /*#__PURE__*/_react.default.createElement("svg", {
    color: "currentColor",
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    xmlns: "http://www.w3.org/2000/svg",
    className: className
  }, /*#__PURE__*/_react.default.createElement("title", null, contextLocale.speechRecording), Array.from({
    length: COUNT
  }).map((_, index) => {
    const dest = (SIZE - RECT_WIDTH * COUNT) / (COUNT - 1);
    const x = index * (dest + RECT_WIDTH);
    const yMin = SIZE / 2 - RECT_HEIGHT_MIN / 2;
    const yMax = SIZE / 2 - RECT_HEIGHT_MAX / 2;
    return /*#__PURE__*/_react.default.createElement("rect", {
      fill: "currentColor",
      rx: RECT_RADIUS,
      ry: RECT_RADIUS,
      height: RECT_HEIGHT_MIN,
      width: RECT_WIDTH,
      x: x,
      y: yMin,
      key: index
    }, /*#__PURE__*/_react.default.createElement("animate", {
      attributeName: "height",
      values: `${RECT_HEIGHT_MIN}; ${RECT_HEIGHT_MAX}; ${RECT_HEIGHT_MIN}`,
      keyTimes: "0; 0.5; 1",
      dur: `${DURATION}s`,
      begin: `${DURATION / COUNT * index}s`,
      repeatCount: "indefinite"
    }), /*#__PURE__*/_react.default.createElement("animate", {
      attributeName: "y",
      values: `${yMin}; ${yMax}; ${yMin}`,
      keyTimes: "0; 0.5; 1",
      dur: `${DURATION}s`,
      begin: `${DURATION / COUNT * index}s`,
      repeatCount: "indefinite"
    }));
  }));
}