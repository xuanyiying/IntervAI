import * as React from 'react';
import { useEvent } from '@rc-component/util';
export default function useSelectTriggerControl(elements, open, triggerOpen, customizedTrigger) {
  const onGlobalMouseDown = useEvent(event => {
    // If trigger is customized, Trigger will take control of popupVisible
    if (customizedTrigger) {
      return;
    }
    let target = event.target;
    if (target.shadowRoot && event.composed) {
      target = event.composedPath()[0] || target;
    }
    if (open &&
    // Marked by SelectInput mouseDown event
    !event._ignore_global_close && elements().filter(element => element).every(element => !element.contains(target) && element !== target)) {
      // Should trigger close
      triggerOpen(false);
    }
  });
  React.useEffect(() => {
    window.addEventListener('mousedown', onGlobalMouseDown);
    return () => window.removeEventListener('mousedown', onGlobalMouseDown);
  }, [onGlobalMouseDown]);
}