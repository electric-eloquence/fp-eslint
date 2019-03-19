((d, uiProps, uiFns) => {
  'use strict';

  /**
   * Wait for $(document).ready() in order to get window.FEPPER. (On DOMContentLoaded will fire too soon.)
   */
  $(d).ready(function () {
    // ///////////////////////////////////////////////////////////////////////////
    // BREAKPOINT VARS AND FUNCTIONS.
    // Requires the window.FEPPER object so run after DOMContentLoaded.
    // ///////////////////////////////////////////////////////////////////////////

    const bpObj = uiFns.getBreakpointsSorted(window.FEPPER);

    function sizeiframe(e) {
      e.preventDefault();

      const sgSize = this.id.replace('sg-size-', '');

      for (let idx1 in bpObj) {
        if (sgSize === idx1) {
          const size = bpObj[idx1];
          let theSize;

          if (size > uiProps.maxViewportWidth) {
            // If the entered size is larger than the max allowed viewport size, cap
            // value at max vp size.
            theSize = uiProps.maxViewportWidth;
          }
          else if (size < uiProps.minViewportWidth) {
            // If the entered size is less than the minimum allowed viewport size, cap
            // value at min vp size.
            theSize = uiProps.minViewportWidth;
          }
          else {
            theSize = size;
          }

          uiFns.stopDisco();
          uiFns.stopGrow();
          uiFns.sizeiframe(theSize);

          break;
        }
      }
    }

    const optionsPanel = d.querySelector('.sg-size-options');

    if (optionsPanel) {
      for (let idx1 in bpObj) {
        if (bpObj.hasOwnProperty(idx1)) {
          const a = d.createElement('a');
          const li = d.createElement('li');
          a.innerHTML = idx1.toUpperCase();

          a.setAttribute('href', '#');
          a.setAttribute('id', 'sg-size-' + idx1);
          li.appendChild(a);
          optionsPanel.insertBefore(li, optionsPanel.firstChild);
        }
      }
    }

    // Iterate through breakpoints in order to create event listeners that resize
    // the viewport.
    for (let idx1 in bpObj) {
      if (bpObj.hasOwnProperty(idx1)) {
        const bpBtn = d.getElementById('sg-size-' + idx1);
        if (bpBtn) {
          bpBtn.addEventListener('click', sizeiframe, false);
        }
      }
    }
  });
})(document, window.FEPPER_UI.uiProps, window.FEPPER_UI.uiFns);
