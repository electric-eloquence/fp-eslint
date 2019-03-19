/**
 * Copyright (c) 2013-2016 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license.
 */
((d, uiProps, uiFns) => {
  'use strict';

  const config = window.config;
  const Feplet = window.Feplet;
  const Mousetrap = window.Mousetrap;

  const $window = $(window);
  const $document = $(document);

  const sizeiframe = uiFns.sizeiframe;
  const startDisco = uiFns.startDisco;
  const startGrow = uiFns.startGrow;
  const stopDisco = uiFns.stopDisco;
  const stopGrow = uiFns.stopGrow;
  const urlHandler = uiFns.urlHandler;

  const warnCtrlShiftLEdge = '"ctrl+shift+l" is unpredictable on Microsoft Edge.\nTry "ctrl+alt+l" instead.';

  let bpObj;

  function goResize(abbrev) {
    const $sgSizeButton = $(`#sg-size-${abbrev}`);

    stopDisco();
    stopGrow();
    sizeiframe(bpObj[abbrev]);

    if ($sgSizeButton) {
      $sgSizeButton.focus();
    }
  }

  // Handle extra extra small button.
  function goXXSmall() {
    goResize('xx');
  }

  // Handle extra small button.
  function goXSmall() {
    goResize('xs');
  }

  // Handle small button.
  function goSmall() {
    goResize('sm');
  }

  // Handle medium button.
  function goMedium() {
    goResize('md');
  }

  // Handle large button.
  function goLarge() {
    goResize('lg');
  }

  /**
   * Data Saver.
   */
  class DataSaver {

    /**
     * @param {string} cookieName - The name of the cookie to store the data in.
     */
    constructor(cookieName) {
      this.cookieName = cookieName;
    }

    /**
     * Add a given value to the cookie.
     *
     * @param {string} name - The name of the key.
     * @param {string} val - The value.
     */
    addValue(name, val) {
      const cookieValOrig = $.cookie(this.cookieName);
      let cookieValNew = name + '~' + val;

      if (cookieValOrig) {
        cookieValNew = cookieValOrig + '|' + cookieValNew;
      }

      $.cookie(this.cookieName, cookieValNew);
    }

    /**
     * Update a value found in the cookie. If the key doesn't exist add the value.
     *
     * @param {string} name - The name of the key.
     * @param {string} val - The value.
     */
    updateValue(name, val) {
      if (this.findValue(name)) {
        const cookieVals = $.cookie(this.cookieName).split('|');
        let cookieValNew = '';

        for (let i = 0; i < cookieVals.length; i++) {
          const fieldVals = cookieVals[i].split('~');

          if (fieldVals[0] === name) {
            fieldVals[1] = val;
          }

          if (i) {
            cookieValNew += '|';
          }

          cookieValNew += fieldVals[0] + '~' + fieldVals[1];
        }

        $.cookie(this.cookieName, cookieValNew);
      }
      else {
        this.addValue(name, val);
      }
    }

    /**
     * Remove the given key.
     *
     * @param {string} name - The name of the key.
     */
    removeValue(name) {
      const cookieVals = $.cookie(this.cookieName).split('|');
      let k = 0;
      let cookieValNew = '';

      for (let i = 0; i < cookieVals.length; i++) {
        const fieldVals = cookieVals[i].split('~');

        if (fieldVals[0] !== name) {
          if (k) {
            cookieValNew += '|';
          }

          cookieValNew += fieldVals[0] + '~' + fieldVals[1];
          k++;
        }
      }

      $.cookie(this.cookieName, cookieValNew);
    }

    /**
     * Find the value using the given key.
     *
     * @param {string} name - The name of the key.
     * @returns {string} The value of the key or empty string if the value isn't found.
     */
    findValue(name) {
      if ($.cookie(this.cookieName)) {
        const cookieVals = $.cookie(this.cookieName).split('|');

        for (let i = 0; i < cookieVals.length; i++) {
          const fieldVals = cookieVals[i].split('~');

          if (fieldVals[0] === name) {
            return fieldVals[1];
          }
        }
      }

      return '';
    }
  }

  const dataSaver = window.dataSaver = new DataSaver('patternlab');

  /**
   * Default languages for Prism to match rendering capability.
   *
   * Copyright (c) 2016 Dave Olsen, http://dmolsen.com
   * Licensed under the MIT license.
   */
  const prismLanguages = {
    languages: [],

    get: (key) => {
      for (let i = 0; i < prismLanguages.languages.length; i++) {
        const language = prismLanguages.languages[i];

        if (language[key]) {
          return language[key];
        }
      }

      return 'markup';
    },

    add: (language) => {
      // See if the language already exists. Overwrite if it does.
      for (let key in language) {
        if (language.hasOwnProperty(key)) {
          for (let i = 0; i < prismLanguages.languages.length; i++) {
            if (prismLanguages.languages[i][key]) {
              prismLanguages.languages[i][key] = language[key];

              return;
            }
          }
        }
      }
      prismLanguages.languages.push(language);
    }
  };

  prismLanguages.add({mustache: 'markup'});

  /**
   * This gets attached as an event listener, so do not use arrow function notation.
   *
   * @param {object} event - Event object.
   */
  function receiveIframeMessage(event) {
    const data = uiFns.receiveIframeMessageBoilerplate(event);

    if (!data) {
      return;
    }

    switch (data.event) {
      case 'patternlab.bodyClick': {
        uiFns.closeAllPanels();

        break;
      }
      case 'patternlab.keyPress': {
        switch (data.keyPress) {
          case 'ctrl+alt+0':
          case 'ctrl+shift+0':
            goXXSmall();

            break;

          case 'ctrl+shift+x':
            goXSmall();

            break;

          case 'ctrl+shift+s':
            goSmall();

            break;

          case 'ctrl+shift+m':
            goMedium();

            break;

          case 'ctrl+shift+l':
            goLarge();

            if (navigator.userAgent.indexOf('Edge') > -1) {
              alert(warnCtrlShiftLEdge);
            }

            break;

          case 'ctrl+alt+l':
            goLarge();

            break;

          case 'ctrl+alt+w':
          case 'ctrl+shift+w':
            uiFns.goWhole();

            break;

          case 'ctrl+alt+r':
            uiFns.goRandom();

            break;

          case 'ctrl+alt+g':
            uiFns.toggleGrow();

            break;

          case 'ctrl+shift+d':
            uiFns.toggleDisco();

            break;
        }

        break;
      }
      case 'patternlab.pageLoad': {
        if (
          !urlHandler.skipBack &&
          (!history.state || history.state.pattern !== data.patternPartial)
        ) {
          urlHandler.pushPattern(data.patternPartial);
        }

        // Reset default.
        urlHandler.skipBack = false;

        break;
      }
      case 'patternlab.updatePatternInfo': {
        const addressReplacement = uiFns.urlHandler.getAddressReplacement(data.patternPartial);

        // The primary use-case for this function is replacing history state instead of pushing it.
        history.replaceState({pattern: data.patternPartial}, null, addressReplacement);
        uiFns.updatePatternInfo(data.patternPartial, data.path);

        break;
      }
    }
  }

  // Render the template before adding more listeners.
  const templateNav = d.getElementById('sg-nav-target');

  try {
    // Load pattern nav.
    const templateRenderedNav = Feplet.render(
      templateNav.innerHTML,
      {patternTypes: window.navItems.patternTypes, pathsPublic: window.config.pathsPublic}
    );
    templateNav.innerHTML = templateRenderedNav;
    templateNav.classList.remove('is-vishidden');

    // Load ish controls.
    const templateIsh = d.getElementById('sg-controls');
    const templateRenderedIsh = Feplet.render(templateIsh.innerHTML, window.ishControls);
    templateIsh.innerHTML = templateRenderedIsh;
    templateIsh.classList.remove('is-vishidden');
  }
  catch (err) {
    // TODO: Internationalize this.
    const message = '<h1>Nothing Here Yet</h1><p>Please generate your site before trying to view it.</p>';
    templateNav.innerHTML = message;
  }

  window.addEventListener('message', receiveIframeMessage, false);

  /**
   * Handle the onpopstate event.
   *
   * @param {object} event - Event object.
   */
  window.onpopstate = function (event) {
    urlHandler.skipBack = true;
    urlHandler.popPattern(event);
  };

  $document.ready(function () {
    const bodyFontSize = uiProps.bodyFontSize;
    const sgGenContainer = uiProps.sgGenContainer;
    const sgViewport = uiProps.sgViewport;
    const updateSizeReading = uiFns.updateSizeReading;
    bpObj = uiFns.getBreakpointsSorted(window.FEPPER);

    function updateViewportWidth(size) {
      sgViewport.style.width = size + 'px';
      sgGenContainer.style.width = (size * 1 + 14) + 'px';

      updateSizeReading(size);
    }

    // Some execution that should occur before adding more listeners.

    // Capture the viewport width that was loaded and modify it so it fits with the pull bar.
    const viewportWidthOrig = sgViewport.clientWidth;
    sgGenContainer.style.width = viewportWidthOrig + 'px';

    if (
      'ontouchstart' in d.documentElement &&
      $window.width() <= 1024
    ) {
      $('#sg-rightpull-container').width(0);
    }
    else {
      sgViewport.style.width = (viewportWidthOrig - 14) + 'px';
    }

    updateSizeReading(sgViewport.clientWidth);

    // Viewport actions per search params.
    const trackViewportWidth = true; // Can toggle this feature on & off.
    const searchParams = uiProps.searchParams;
    let vpWidth = 0;

    if (searchParams.g || searchParams.grow) {
      startGrow();
    }
    else if (searchParams.d || searchParams.disco) {
      startDisco();
    }
    else if (searchParams.w || searchParams.width) {
      vpWidth = searchParams.w || searchParams.width;

      if (vpWidth.indexOf('em') > -1) {
        vpWidth = Math.round(vpWidth.replace('em', '') * bodyFontSize);
      }
      else {
        vpWidth = vpWidth.replace('px', '');
      }

      dataSaver.updateValue('vpWidth', vpWidth);
      updateViewportWidth(vpWidth);
    }
    // Otherwise check for viewport width cookie.
    else if (trackViewportWidth) {
      vpWidth = dataSaver.findValue('vpWidth');

      if (vpWidth) {
        updateViewportWidth(vpWidth);
      }
    }

    const protocol = window.location.protocol;
    let patternPartial;

    if (searchParams.p || searchParams.pattern) {
      patternPartial = searchParams.p || searchParams.pattern;
    }
    else if (
      typeof config.defaultPattern === 'string' &&
      config.defaultPattern.trim().length
    ) {
      patternPartial = config.defaultPattern;
    }
    else {
      patternPartial = 'viewall';
    }

    const iframePath = window.patternPaths[patternPartial];
    urlHandler.skipBack = true;

    // Update DOM.
    uiFns.updatePatternInfo(patternPartial, iframePath);
    d.documentElement.classList.add('protocol-' + protocol.slice(0, -1));

    // Update history. Need to do this so uiFns.urlHandler.popPattern has an Event.state.pattern to work with.
    history.replaceState({pattern: patternPartial}, null, null);

    // Update iframe.
    sgViewport.contentWindow.location.replace(iframePath);

    // More listeners.

    // Update dimensions on resize.
    $window.resize(
      uiFns.debounce(
        function () {
          uiProps.sw = d.body.clientWidth;
          uiProps.sh = $document.height();

          if (uiProps.wholeMode === true) {
            sizeiframe(uiProps.sw, false, true);
          }
        }
      )
    );

    // Click handler for elements in pull down menus. Update the iframe. Also close the menu.
    $('a[data-patternpartial]').click(function (e) {
      e.preventDefault();

      // Update the iframe via the history api handler.
      const obj = {
        event: 'patternlab.updatePath',
        path: $(this).attr('href')
      };

      sgViewport.contentWindow.postMessage(obj, uiProps.targetOrigin);
      uiFns.closeAllPanels();
    });

    // Mousetrap keyboard shortcuts.
    // Publicly documenting ctrl+alt+0 because ctrl+shift+0 does not work in Windows.
    // However, allowing ctrl+shift+0 because it is publicly documented by Pattern Lab.
    Mousetrap.bind(['ctrl+alt+0', 'ctrl+shift+0'], function (e) {
      e.preventDefault();
      goXXSmall();

      return false;
    });

    // Extra small.
    Mousetrap.bind('ctrl+shift+x', function (e) {
      e.preventDefault();
      goXSmall();

      return false;
    });

    // Small.
    Mousetrap.bind('ctrl+shift+s', function (e) {
      e.preventDefault();
      goSmall();

      return false;
    });

    // Medium.
    Mousetrap.bind('ctrl+shift+m', function (e) {
      e.preventDefault();
      goMedium();

      return false;
    });

    // Large.
    Mousetrap.bind('ctrl+shift+l', function (e) {
      e.preventDefault();
      goLarge();

      if (navigator.userAgent.indexOf('Edge') > -1) {
        alert(warnCtrlShiftLEdge);
      }

      return false;
    });

    // Large for Microsoft Edge.
    Mousetrap.bind('ctrl+alt+l', function (e) {
      e.preventDefault();
      goLarge();

      return false;
    });

    // Allowing ctrl+shift+w to go whole viewport on MacOS and Microsoft Edge since this shortcut can be easily intuited
    // from the other shortcuts. However, ctrl+shift+w cannot be publicly documented since browser behavior may change
    // without warning in the future.
    Mousetrap.bind(['ctrl+alt+w', 'ctrl+shift+w'], function (e) {
      e.preventDefault();
      uiFns.goWhole();

      return false;
    });

    // Random width.
    Mousetrap.bind('ctrl+alt+r', function (e) {
      e.preventDefault();
      uiFns.goRandom();

      return false;
    });

    // Grow animation.
    Mousetrap.bind('ctrl+alt+g', function (e) {
      e.preventDefault();
      uiFns.toggleGrow();

      return false;
    });

    // Disco mode.
    Mousetrap.bind('ctrl+shift+d', function (e) {
      e.preventDefault();
      uiFns.toggleDisco();

      return false;
    });

    // All escape key behavior.
    Mousetrap.bind('esc', function () {
      if (window.annotationsViewer.annotationsActive) {
        window.annotationsViewer.closeAnnotations();
      }

      if (window.codeViewer.codeActive) {
        window.codeViewer.closeCode();
      }

      window.patternFinder.closeFinder();
    });
  });
})(document, window.FEPPER_UI.uiProps, window.FEPPER_UI.uiFns);
