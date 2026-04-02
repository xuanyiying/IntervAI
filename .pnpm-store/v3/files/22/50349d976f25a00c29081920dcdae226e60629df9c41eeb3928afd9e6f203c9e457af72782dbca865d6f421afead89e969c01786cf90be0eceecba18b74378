"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useOpen;
exports.macroTask = void 0;
var _util = require("@rc-component/util");
var _react = require("react");
const internalMacroTask = fn => {
  const channel = new MessageChannel();
  channel.port1.onmessage = fn;
  channel.port2.postMessage(null);
};
const macroTask = (fn, times = 1) => {
  if (times <= 0) {
    fn();
    return;
  }
  internalMacroTask(() => {
    macroTask(fn, times - 1);
  });
};

/**
 * Trigger by latest open call, if nextOpen is undefined, means toggle.
 * ignoreNext will skip next call in the macro task queue.
 */
exports.macroTask = macroTask;
/**
 * When `open` is controlled, follow the controlled value;
 * Otherwise use uncontrolled logic.
 * Setting `open` takes effect immediately,
 * but setting it to `false` is delayed via MessageChannel.
 *
 * SSR handling: During SSR, `open` is always false to avoid Portal issues.
 * On client-side hydration, it syncs with the actual open state.
 */
function useOpen(propOpen, onOpen, postOpen) {
  // SSR not support Portal which means we need delay `open` for the first time render
  const [rendered, setRendered] = (0, _react.useState)(false);
  (0, _react.useEffect)(() => {
    setRendered(true);
  }, []);
  const [stateOpen, internalSetOpen] = (0, _util.useControlledState)(false, propOpen);

  // During SSR, always return false for open state
  const ssrSafeOpen = rendered ? stateOpen : false;
  const mergedOpen = postOpen(ssrSafeOpen);
  const taskIdRef = (0, _react.useRef)(0);
  const taskLockRef = (0, _react.useRef)(false);
  const triggerEvent = (0, _util.useEvent)(nextOpen => {
    if (onOpen && mergedOpen !== nextOpen) {
      onOpen(nextOpen);
    }
    internalSetOpen(nextOpen);
  });
  const toggleOpen = (0, _util.useEvent)((nextOpen, config = {}) => {
    const {
      ignoreNext = false
    } = config;
    taskIdRef.current += 1;
    const id = taskIdRef.current;
    const nextOpenVal = typeof nextOpen === 'boolean' ? nextOpen : !mergedOpen;

    // Since `mergedOpen` is post-processed, we need to check if the value really changed
    if (nextOpenVal) {
      if (!taskLockRef.current) {
        triggerEvent(nextOpenVal);

        // Lock if needed
        if (ignoreNext) {
          taskLockRef.current = ignoreNext;
          macroTask(() => {
            taskLockRef.current = false;
          }, 2);
        }
      }
      return;
    }
    macroTask(() => {
      if (id === taskIdRef.current && !taskLockRef.current) {
        triggerEvent(nextOpenVal);
      }
    });
  });
  return [mergedOpen, toggleOpen];
}