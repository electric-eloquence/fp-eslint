/**
 * Copyright (c) 2013-2016 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license.
 */
((d) => {
  'use strict';

  window.FEPPER_UI = {};
  const config = window.config;
  const uiFns = window.FEPPER_UI.uiFns = {};
  const uiProps = window.FEPPER_UI.uiProps = {};

  uiFns.closeAllPanels = () => {
    $('.sg-nav-container, .sg-nav-toggle, .sg-acc-handle, .sg-acc-panel').removeClass('active');
  };

  uiFns.closeOtherPanels = (el) => {
    const $el = $(el);
    const $panel = $el.next('.sg-acc-panel');
    const $parentParent = $el.parent().parent();

    // Close other panels if link isn't a subnavigation item.
    if (!$parentParent.hasClass('sg-acc-panel')) {
      $('.sg-acc-handle').not($el).removeClass('active');
      $('.sg-acc-panel').not($panel).removeClass('active');

      // Not a nav item.
      if (!$parentParent.hasClass('sg-nav')) {
        $('.sg-nav-container').removeClass('active');
      }

      // Not a size label.
      if (!$el.hasClass('sg-size-label')) {
        $('.sg-size').removeClass('active');
      }
    }
  };

  uiFns.debounce = (callback, wait = uiProps.timeoutDefault, context = null) => {
    let timeout = null;
    let callbackArgs = null;

    const later = () => callback.apply(context, callbackArgs);

    return function () {
      callbackArgs = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  uiFns.getBreakpointsSorted = (FEPPER) => {
    // Get breakpoint customations made to EITHER variables.styl or fepper-obj.js, with priority given to fepper-obj.js.
    const bpArr = [];
    const bpObj = {};
    const bpObjTmp = {};
    const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

    // Iterate through variables.styl and populate the tmp object for sorting.
    // Replace -1 (or any negative value) with MAX_SAFE_INTEGER.
    for (let idx in window) {
      if (idx.indexOf('bp_') === 0 && idx.indexOf('_max') === idx.length - 4) {
        if (window[idx] < 0) {
          bpObjTmp[idx.slice(3, idx.length - 4)] = MAX_SAFE_INTEGER;
        }
        else {
          bpObjTmp[idx.slice(3, idx.length - 4)] = window[idx];
        }
      }
    }

    // Do same thing with fepper-obj.js, overriding any values conflicting with those in variables.styl.
    if (FEPPER.breakpoints && typeof FEPPER.breakpoints === 'object') {
      for (let idx in FEPPER.breakpoints) {
        if (idx.hasOwnProperty('maxWidth')) {
          if (FEPPER.breakpoints[idx].maxWidth < 0) {
            bpObjTmp[idx] = MAX_SAFE_INTEGER;
          }
          else {
            bpObjTmp[idx] = FEPPER.breakpoints[idx].maxWidth;
          }
        }
      }
    }

    // Populate sorting array.
    for (let idx in bpObjTmp) {
      if (bpObjTmp.hasOwnProperty(idx)) {
        bpArr.push(bpObjTmp[idx]);
      }
    }

    // Sort array from highest to lowest.
    bpArr.sort((a, b) => b - a);

    // This gap is the distance between the 2nd largest bp and the 3rd.
    let gap = 0;
    let iteration = 1;

    for (let idx = 0; idx < bpArr.length; idx++) {
      if (iteration === 3) {
        gap = bpArr[idx - 1] - bpArr[idx];

        break;
      }
      else {
        iteration++;
      }
    }

    // Construct bpObj with sorted breakpoints.
    iteration = 0;

    bpArr.forEach((bp) => {
      for (let idx in bpObjTmp) {
        if (bpObjTmp.hasOwnProperty(idx)) {
          if (bp === bpObjTmp[idx]) {
            if (!iteration && gap) {
              bpObj[idx] = bpArr[1] + gap;
              iteration++;

              break;
            }
            else {
              bpObj[idx] = bp;
              iteration++;

              break;
            }
          }
        }
      }
    });

    return bpObj;
  };

  /**
   * Returns a random number between min and max.
   *
   * @param {number} min - Start of range.
   * @param {number} max - End of range.
   * @returns {number} Random number.
   */
  uiFns.getRandom = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
  };

  /**
   * Handle whole button. Needed in this file because fepper-npm depends on it.
   */
  uiFns.goWhole = () => {
    uiFns.stopDisco();
    uiFns.stopGrow();
    uiFns.sizeiframe(uiProps.sw, true, true);

    if (uiProps.sgSizeW) {
      uiProps.sgSizeW.focus();
    }
  };

  /**
   * Handle random button. Needed in this file because fepper-npm depends on it.
   */
  uiFns.goRandom = () => {
    uiFns.stopDisco();
    uiFns.stopGrow();
    uiFns.sizeiframe(uiFns.getRandom(uiProps.minViewportWidth, uiProps.sw));

    if (uiProps.sgSizeRandom) {
      uiProps.sgSizeRandom.focus();
    }
  };

  /**
   * Boilerplate for receiveIframeMessage functions.
   *
   * @param {object} event - Event object.
   * @returns {object|undefined} Event data.
   */
  uiFns.receiveIframeMessageBoilerplate = (event) => {
    // Does the origin sending the message match the current host? If not, dev/null the request.
    if (
      window.location.protocol !== 'file:' &&
      event.origin !== window.location.protocol + '//' + window.location.host
    ) {
      return;
    }

    let data = {};

    try {
      data = (typeof event.data === 'string') ? JSON.parse(event.data) : event.data;
    }
    catch (err) {
      // Fail gracefully.
    }

    return data;
  };

  uiFns.saveSize = (size) => {
    const dataSaver = window.dataSaver;

    if (!dataSaver.findValue('vpWidth')) {
      dataSaver.addValue('vpWidth', size);
    }
    else {
      dataSaver.updateValue('vpWidth', size);
    }
  };

  /**
   * Resize the viewport.
   *
   * @param {number} size - The target size of the viewport.
   * @param {boolean} animate - For switching the CSS animation on or off.
   * @param {boolean} wholeMode - Whether to take up whole sceen.
   */
  uiFns.sizeiframe = (size, animate = true, wholeMode = false) => {
    if (!size) {
      return;
    }

    const sgViewport = uiProps.sgViewport;
    const sgGenContainer = uiProps.sgGenContainer;
    const maxViewportWidth = uiProps.maxViewportWidth;
    const minViewportWidth = uiProps.minViewportWidth;

    uiProps.wholeMode = wholeMode;

    let theSize;

    // If the entered size is larger than the max allowed viewport size, cap value at max vp size.
    if (size > maxViewportWidth) {
      theSize = maxViewportWidth;
    }
    // If the entered size is less than the minimum allowed viewport size, cap value at min vp size.
    else if (size < minViewportWidth) {
      theSize = minViewportWidth;
    }
    else {
      theSize = size;
    }

    // Conditionally remove CSS animation class from viewport.
    if (animate === false) {
      uiProps.sgGenContainer.classList.remove('vp-animate');
      uiProps.sgViewport.classList.remove('vp-animate');
    }
    else {
      uiProps.sgGenContainer.classList.add('vp-animate');
      uiProps.sgViewport.classList.add('vp-animate');
    }

    // Resize viewport wrapper to desired size + size of drag resize handler.
    sgGenContainer.style.width = (theSize + uiProps.viewportResizeHandleWidth) + 'px';
    // Resize viewport to desired size.
    sgViewport.style.width = theSize + 'px';

    uiFns.updateSizeReading(theSize); // Update values in toolbar.
    uiFns.saveSize(theSize); // Save current viewport to cookie.
  };

  uiFns.startDisco = () => {
    uiProps.discoMode = true;
    uiProps.discoId = setInterval(() => {
      uiFns.sizeiframe(uiFns.getRandom(uiProps.minViewportWidth, uiProps.sw));
    }, 800);

    if (uiProps.sgSizeDisco) {
      uiProps.sgSizeDisco.focus();
    }
  };

  uiFns.startGrow = () => {
    let viewportWidth = uiProps.minViewportWidth;
    uiProps.growMode = true;

    uiProps.sgGenContainer.classList.remove('vp-animate');
    uiProps.sgViewport.classList.remove('vp-animate');
    uiFns.sizeiframe(viewportWidth, false);

    if (uiProps.sgSizeGrow) {
      uiProps.sgSizeGrow.focus();
    }

    setTimeout(() => {
      uiProps.growId = setInterval(() => {
        if (viewportWidth < uiProps.sw) {
          viewportWidth++;

          uiFns.sizeiframe(viewportWidth, false);
        }
        else {
          uiFns.stopGrow();
        }
      }, 20);
    }, uiProps.timeoutDefault);
  };

  uiFns.stopDisco = () => {
    uiProps.discoMode = false;

    clearInterval(uiProps.discoId);

    if (uiProps.sgSizeDisco) {
      uiProps.sgSizeDisco.blur();
    }
  };

  uiFns.stopGrow = () => {
    const sgViewport = uiProps.sgViewport;
    const sgGenContainer = uiProps.sgGenContainer;
    uiProps.growMode = false;

    sgViewport.classList.remove('grow-mode');
    sgGenContainer.classList.remove('grow-mode');
    clearInterval(uiProps.growId);

    if (uiProps.sgSizeGrow) {
      uiProps.sgSizeGrow.blur();
    }
  };

  uiFns.toggleDisco = () => {
    if (!uiProps.discoMode) {
      uiFns.startDisco();
    }
    else {
      uiFns.stopDisco();
    }
  };

  uiFns.toggleGrow = () => {
    if (!uiProps.growMode) {
      uiFns.startGrow();
    }
    else {
      uiFns.stopGrow();
    }
  };

  /**
   * Update Pixel and Em inputs.
   *
   * @param {number} size - The input number.
   * @param {string} unit - The type of unit: either px or em. Default is px. Accepted values are "px" and "em".
   * @param {string} target - What input to update.
   */
  uiFns.updateSizeReading = (size, unit, target) => {
    const bodyFontSize = uiProps.bodyFontSize;
    const sgSizeEm = uiProps.sgSizeEm; // Em size input element in toolbar.
    const sgSizePx = uiProps.sgSizePx; // Px size input element in toolbar.

    let emSize;
    let pxSize;

    if (unit === 'em') { // If size value is in em units.
      emSize = size;
      pxSize = Math.round(size * bodyFontSize);
    }
    else { // If value is px or absent.
      pxSize = size;
      emSize = size / bodyFontSize;
    }

    if (target === 'updatePxInput') {
      sgSizePx.value = pxSize;
    }
    else if (target === 'updateEmInput') {
      sgSizeEm.value = emSize.toFixed(2);
    }
    else {
      sgSizeEm.value = emSize.toFixed(2);
      sgSizePx.value = pxSize;
    }
  };

  uiFns.updatePatternInfo = (patternPartial, path) => {
    const titleSplit = d.title.split(uiProps.titleSeparator);
    d.title = titleSplit[0] + uiProps.titleSeparator + patternPartial;

    if (uiProps.sgRaw) {
      uiProps.sgRaw.setAttribute('href', path);
    }
  };

  /**
   * URL Handler.
   *
   * Helps handle the initial iframe source. Parses a string to see if it matches an expected pattern in Pattern Lab.
   */
  uiFns.urlHandler = {
    // Set up some default vars.
    skipBack: false,

    getAddressReplacement: (patternPartial) => {
      const searchParam = '?p=' + patternPartial;
      let addressReplacement;

      if (window.location.protocol === 'file:') {
        addressReplacement = window.location.href.split('?')[0] + searchParam;
      }
      else {
        addressReplacement = window.location.protocol + '//' + window.location.host +
          window.location.pathname.replace('index.html', '') + searchParam;
      }

      return addressReplacement;
    },

    /**
     * Break up a pattern into its parts, pattern type and pattern name.
     *
     * @param {string} name - The shorthand partials syntax for a given pattern.
     * @param {object} paths - The paths to be compared.
     * @returns {array} The pattern type and pattern name.
     */
    getPatternInfo: (name, paths) => {
      const patternBits = name.split('-');
      const c = patternBits.length;
      let patternType = patternBits[0];
      let i = 1;

      while (typeof paths[patternType] === 'undefined' && i < c) {
        patternType += '-' + patternBits[i];
        i++;
      }

      const pattern = name.slice(patternType.length + 1, name.length);

      return [patternType, pattern];
    },

    /**
     * Get query string search params for a particular item.
     *
     * @returns {object} An object containing to keys and values of window.location.search.
     */
    getSearchParams: () => {
      const paramsObj = {};
      const paramsItr = new URLSearchParams(window.location.search);

      for (let param of paramsItr) {
        paramsObj[param[0]] = param[1];
      }

      return paramsObj;
    },

    /**
     * On a click forward or backward, modify the url and iframe source.
     *
     * @param {object} e - Event info like state and properties set in pushState().
     */
    popPattern: (e) => {
      const state = e.state;
      let patternPartial = '';

      if (state && state.pattern) {
        patternPartial = state.pattern;
      }
      else {
        uiFns.urlHandler.skipBack = false;

        return;
      }

      const iframePath = window.patternPaths[patternPartial];
      const obj = {event: 'patternlab.updatePath', path: iframePath};
      const pParam = uiFns.urlHandler.getSearchParams().p;

      if (pParam && pParam !== patternPartial) {
        const addressReplacement = uiFns.urlHandler.getAddressReplacement(patternPartial);

        history.replaceState(state, null, addressReplacement);
      }

      uiFns.updatePatternInfo(patternPartial, iframePath);
      uiProps.sgViewport.contentWindow.postMessage(obj, uiProps.targetOrigin);
    },

    /**
     * Push a pattern onto the current history based on a click.
     * @param {string} patternPartial - The shorthand partials syntax for a given pattern.
     */
    pushPattern: (patternPartial) => {
      const addressReplacement = uiFns.urlHandler.getAddressReplacement(patternPartial);
      const data = {pattern: patternPartial};

      history.pushState(data, null, addressReplacement);
      uiFns.updatePatternInfo(patternPartial, window.patternPaths[patternPartial]);
    }
  };

  /**
   * Dependents of uiProps will need to listen for DOMContentLoaded as well.
   */
  d.addEventListener(
    'DOMContentLoaded',
    function () {
      // Saved elements.
      uiProps.sgGenContainer = d.getElementById('sg-gen-container');
      uiProps.sgHeader = d.querySelector('.sg-header');
      uiProps.sgPatterns = d.getElementById('sg-patterns');
      uiProps.sgRaw = d.getElementById('sg-raw');
      uiProps.sgSizeDisco = d.getElementById('sg-size-disco');
      uiProps.sgSizeEm = d.getElementById('sg-size-em');
      uiProps.sgSizeGrow = d.getElementById('sg-size-grow');
      uiProps.sgSizePx = d.getElementById('sg-size-px');
      uiProps.sgSizeRandom = d.getElementById('sg-size-random');
      uiProps.sgSizeW = d.getElementById('sg-size-w');
      uiProps.sgTAnnotations = d.getElementById('sg-t-annotations');
      uiProps.sgTCode = d.getElementById('sg-t-code');
      uiProps.sgTToggle = d.getElementById('sg-t-toggle');
      uiProps.sgViewport = d.getElementById('sg-viewport');
      uiProps.sgVpWrap = d.getElementById('sg-vp-wrap');

      // Measurements.
      uiProps.bodyFontSize = parseInt(window.getComputedStyle(d.body).getPropertyValue('font-size'), 10);
      uiProps.headerHeight = uiProps.sgHeader ? uiProps.sgHeader.clientHeight : null;
      uiProps.maxViewportWidth = config ? parseInt(config.ishMaximum) : null; // Maxiumum Size for Viewport.
      uiProps.minViewportWidth = config ? parseInt(config.ishMinimum) : null; // Minimum Size for Viewport.
      uiProps.sh = window.innerHeight;
      uiProps.sw = d.body.clientWidth;
      uiProps.viewportResizeHandleWidth = 14; // Width of the viewport drag-to-resize handle.

      const savedVpWidth = window.dataSaver ? parseInt(window.dataSaver.findValue('vpWidth'), 10) : null;

      // Modes.
      uiProps.discoMode = false;
      uiProps.growMode = false;
      uiProps.wholeMode = (savedVpWidth === uiProps.sw);

      // Other.
      uiProps.timeoutDefault = 200;
      uiProps.discoId = 0;
      uiProps.growId = 0;
      uiProps.searchParams = uiFns.urlHandler.getSearchParams();
      uiProps.targetOrigin =
        (window.location.protocol === 'file:') ? '*' : window.location.protocol + '//' + window.location.host;
      uiProps.titleSeparator = ' : ';
    },
    false
  );
})(document);
