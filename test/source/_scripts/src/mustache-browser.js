((d, uiProps) => {
  'use strict';

  if (window.location.protocol === 'file:') {
    return;
  }

  const codeFill = d.getElementById('sg-code-fill');
  const codeTitle = d.getElementById('sg-code-title-mustache');

  if (codeFill) {
    // Give the PL Mustache code viewer the appearance of being linked.
    codeFill.addEventListener(
      'mouseover',
      function () {
        if (codeTitle.className.indexOf('sg-code-title-active') > -1) {
          codeFill.style.cursor = 'pointer';
        }
        else {
          codeFill.style.cursor = 'default';
        }
      },
      false
    );

    // Send to Fepper's Mustache browser when clicking the viewer's Mustache code.
    codeFill.addEventListener(
      'click',
      function () {
        if (codeTitle.className.indexOf('sg-code-title-active') > -1) {
          // Remove padding from viewport bottom.
          d.getElementById('sg-vp-wrap').style.paddingBottom = 0;

          // Close nav item.
          const sgView = d.getElementById('sg-view');
          sgView.style.height = 'auto';
          sgView.classList.remove('active');

          const sgCodeContainer = d.getElementById('sg-code-container');
          const patternPartial = sgCodeContainer.dataset.patternpartial;
          const path = window.location.origin + '/mustache-browser/?partial=' + patternPartial;

          // Load Mustache Browser
          uiProps.sgViewport.contentWindow.location.assign(path);

          // Close code viewer.
          window.codeViewer.closeCode();

          // Update annotations and code viewer states.
          window.annotationsViewer.mustacheBrowser = true;
          window.codeViewer.mustacheBrowser = true;
        }
      },
      false
    );
  }
})(document, window.FEPPER_UI.uiProps);
