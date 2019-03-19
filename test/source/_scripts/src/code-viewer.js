/**
 * Copyright (c) 2013 Brad Frost, http://bradfrostweb.com & Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license.
 */
((d, uiProps, uiFns) => {
  'use strict';

  const $document = $(document);
  const $sgCodeContainer = $('#sg-code-container');
  const $sgCodeFill = $('#sg-code-fill');
  const $sgCodeLineage = $('#sg-code-lineage');
  const $sgCodeLineageR = $('#sg-code-lineager');
  const $sgCodePatternstate = $('#sg-code-pattern-state');
  const $sgCodeTitleHtml = $('#sg-code-title-html');
  const $sgCodeTitleMustache = $('#sg-code-title-mustache');
  const $sgCodeTitles = $('.sg-code-title');
  const Mousetrap = window.Mousetrap;

  /**
   * Code view support for the viewer.
   * Not using arrow notation for member functions because some need "this" to refer to response objects.
   */
  const codeViewer = window.codeViewer = {
    // Set up some defaults.
    codeActive: false,
    copyOnInit: false,
    encoded: '',
    ids: {e: '#sg-code-title-html', m: '#sg-code-title-mustache'},
    mustache: '',
    mustacheBrowser: false,
    tabActive: 'm',
    viewall: false,

    /**
     * When loading the code view make sure the active tab is highlighted and filled in appropriately.
     *
     * @param {string} type - Single letter that refers to classes and types.
     * @param {string} code - Code to appear in code view.
     */
    activateDefaultTab: function (type, code) {
      $sgCodeTitles.removeClass('sg-code-title-active');

      switch (type) {
        case 'e':
          $sgCodeTitleHtml.addClass('sg-code-title-active');

          break;

        case 'm':
          $sgCodeTitleMustache.addClass('sg-code-title-active');

          break;
      }

      $sgCodeFill.removeClass().addClass('language-markup');
      $sgCodeFill.html(code);
      window.Prism.highlightElement($sgCodeFill[0]);

      if (codeViewer.copyOnInit) {
        codeViewer.selectCode();
        codeViewer.copyOnInit = false;
      }
    },

    /**
     * Clear any selection of code when swapping tabs or opening a new pattern.
     */
    clearSelection: function () {
      if (!codeViewer.codeActive) {
        return;
      }

      if (window.getSelection().empty) {
        window.getSelection().empty();
      }
      else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges();
      }
    },

    closeCode: function () {
      // Tell the pattern that code view has been turned off.
      const obj = {codeToggle: 'off'};

      uiProps.sgViewport.contentWindow.postMessage(obj, uiProps.targetOrigin);

      // Note it's turned off in the viewer.
      codeViewer.codeActive = false;
      uiProps.sgVpWrap.style.paddingBottom = '0';

      codeViewer.slideCode($sgCodeContainer.outerHeight());
      uiProps.sgTCode.classList.remove('active');
    },

    /**
     * Add the basic markup and events for the code container.
     */
    codeContainerInit: function () {
      $sgCodeContainer // Has class sg-view-container.
        .css('bottom', -$document.outerHeight())
        .addClass('anim-ready');

      // Make sure the close button handles the click.
      $('#sg-code-close-btn').click(function (e) {
        e.preventDefault();
        codeViewer.closeCode();
      });

      // Make sure the click events are handled on the HTML tab.
      $(codeViewer.ids.e).click(function (e) {
        e.preventDefault();
        codeViewer.swapCode('e');
      });

      // Make sure the click events are handled on the Mustache tab.
      $(codeViewer.ids.m).click(function (e) {
        e.preventDefault();
        codeViewer.swapCode('m');
      });
    },

    openCode: function () {
      // Do nothing if viewing Mustache Browser.
      if (codeViewer.mustacheBrowser) {
        return;
      }

      // Make sure the annotations overlay is off before showing code view.
      const objAnnotationsToggle = {annotationsToggle: 'off'};
      window.annotationsViewer.annotationsActive = false;

      uiProps.sgTAnnotations.classList.remove('active');
      uiProps.sgViewport.contentWindow.postMessage(objAnnotationsToggle, uiProps.targetOrigin);
      window.annotationsViewer.slideAnnotations($sgCodeContainer.outerHeight());

      // Tell the pattern that code view has been turned on.
      const objCodeToggle = {codeToggle: 'on'};

      uiProps.sgViewport.contentWindow.postMessage(objCodeToggle, uiProps.targetOrigin);

      // Note it's turned on in the viewer.
      codeViewer.codeActive = true;

      uiProps.sgTCode.classList.add('active');
    },

    printXHRError: function () {
      let error;

      if (window.location.protocol === 'file:' && !this.status) {
        error = 'Access to XMLHttpRequest with the file protocol scheme has been blocked by CORS policy.';
      }
      else {
        error = `Status ${this.status}: ${this.statusText}`;
      }

      if (codeViewer.tabActive === 'e') {
        codeViewer.encoded = error;
        codeViewer.activateDefaultTab('e', error);
      }
      else if (codeViewer.tabActive === 'm') {
        codeViewer.mustache = error;
        codeViewer.activateDefaultTab('m', error);
      }
    },

    /**
     * This runs once the AJAX request for the encoded markup is finished.
     * If the encoded tab is the current active tab, it adds the content to the default code container
     */
    saveEncoded: function () {
      let encoded = this.responseText;

      // We sometimes want markup code to be in an HTML-like template language with tags delimited by stashes.
      // In order for js-beautify to indent such code correctly, any space between control characters #, ^, and /, and
      // the variable name must be removed. However, we want to add the spaces back later.
      // \u00A0 is &nbsp; a space character not enterable by keyboard, and therefore a good delimiter.
      encoded = encoded.replace(/(\{\{#)(\s+)(\S+)/g, '$1$3$2\u00A0');
      encoded = encoded.replace(/(\{\{\^)(\s+)(\S+)/g, '$1$3$2\u00A0');
      encoded = encoded.replace(/(\{\{\/)(\s+)(\S+)/g, '$1$3$2\u00A0');

      encoded = window.html_beautify(encoded, {
        indent_handlebars: true,
        indent_size: 2,
        wrap_line_length: 0
      });

      // Add back removed spaces to retain the look intended by the author.
      encoded = encoded.replace(/(\{\{#)(\S+)(\s+)\u00A0/g, '$1$3$2');
      encoded = encoded.replace(/(\{\{\^)(\S+)(\s+)\u00A0/g, '$1$3$2');
      encoded = encoded.replace(/(\{\{\/)(\S+)(\s+)\u00A0/g, '$1$3$2');

      // Delete empty lines.
      encoded = encoded.replace(/^\s*$\n/gm, '');

      // Encode with HTML entities.
      encoded = window.he.encode(encoded);

      codeViewer.encoded = encoded;

      if (codeViewer.tabActive === 'e') {
        codeViewer.activateDefaultTab('e', encoded);
      }
    },

    /**
     * This runs once the AJAX request for the mustache markup is finished.
     * If the mustache tab is the current active tab, it adds the content to the default code container.
     */
    saveMustache: function () {
      let encoded = this.responseText;
      encoded = window.he.encode(encoded);
      codeViewer.mustache = encoded;

      if (codeViewer.tabActive === 'm') {
        codeViewer.activateDefaultTab('m', encoded);
      }
    },

    scrollViewall: function () {
      uiProps.sgViewport.contentWindow.postMessage({codeScrollViewall: true}, uiProps.targetOrigin);
    },

    /**
     * Select the code where using cmd+a/ctrl+a.
     */
    selectCode: function () {
      const range = d.createRange();
      const selection = window.getSelection();

      range.selectNodeContents($sgCodeFill[0]);
      selection.removeAllRanges();
      selection.addRange(range);
    },

    /**
     * Slides the panel.
     *
     * @param {number} pos - The distance to slide.
     */
    slideCode: function (pos) {
      $sgCodeContainer.css('bottom', -pos);
    },

    /**
     * Depending on what tab is clicked this swaps out the code container. Makes sure prism highlight is added.
     *
     * @param {string} type - Single letter abbreviation of type.
     */
    swapCode: function (type) {
      if (!codeViewer.codeActive) {
        return;
      }

      let fill = '';
      codeViewer.tabActive = type;

      $sgCodeTitles.removeClass('sg-code-title-active');

      switch (type) {
        case 'e':
          fill = codeViewer.encoded;

          $sgCodeTitleHtml.addClass('sg-code-title-active');

          break;

        case 'm':
          fill = codeViewer.mustache;

          $sgCodeTitleMustache.addClass('sg-code-title-active');

          break;
      }

      $sgCodeFill.removeClass().addClass('language-markup');
      $sgCodeFill.html(fill);
      window.Prism.highlightElement($sgCodeFill[0]);
      codeViewer.clearSelection();
    },

    /**
     * Decide on if the code panel should be open or closed.
     */
    toggleCode: function () {
      if (!codeViewer.codeActive) {
        codeViewer.openCode();
      }
      else {
        codeViewer.closeCode();
      }
    },

    /**
     * When turning on or switching between patterns with code view on make sure we get the code from from the pattern
     * via post message.
     *
     * @param {array} lineage - Lineage array.
     * @param {array} lineageR - Reverse lineage array.
     * @param {string} patternPartial - The shorthand partials syntax for a given pattern.
     * @param {string} patternState - inprogress, inreview, complete
     */
    updateCode: function (lineage, lineageR, patternPartial, patternState) {

      // Clear any selections that might have been made.
      codeViewer.clearSelection();

      // Set data-patternpartial attribute.
      $sgCodeContainer.attr('data-patternpartial', patternPartial);

      // Draw lineage.
      if (lineage.length) {
        let lineageList = '';

        for (let i = 0; i < lineage.length; i++) {
          let cssClass = '';

          if (lineage[i].lineageState) {
            cssClass = 'sg-pattern-state ' + lineage[i].lineageState;
          }

          lineageList += (i === 0) ? '' : ', ';
          lineageList += '<a href="' + lineage[i].lineagePath + '" class="' + cssClass + '" data-patternpartial="';
          lineageList += lineage[i].lineagePattern + '">' + lineage[i].lineagePattern + '</a>';
        }

        $sgCodeLineage.css('display', 'block');
        $('#sg-code-lineage-fill').html(lineageList);
      }
      else {
        $sgCodeLineage.css('display', 'none');
      }

      // Draw reverse lineage.
      if (lineageR.length) {
        let lineageRList = '';

        for (let i = 0; i < lineageR.length; i++) {
          let cssClass = '';

          if (lineageR[i].lineageState) {
            cssClass = 'sg-pattern-state ' + lineageR[i].lineageState;
          }

          lineageRList += (i === 0) ? '' : ', ';
          lineageRList += '<a href="' + lineageR[i].lineagePath + '" class="' + cssClass + '" data-patternpartial="';
          lineageRList += lineageR[i].lineagePattern + '">' + lineageR[i].lineagePattern + '</a>';
        }

        $sgCodeLineageR.css('display', 'block');
        $('#sg-code-lineager-fill').html(lineageRList);
      }
      else {
        $sgCodeLineageR.css('display', 'none');
      }

      // When clicking on a lineage item update the iframe.
      $('#sg-code-lineage-fill a, #sg-code-lineager-fill a').click(function (e) {
        e.preventDefault();

        const obj = {
          event: 'patternlab.updatePath',
          path: $(this).attr('href')
        };

        uiProps.sgViewport.contentWindow.postMessage(obj, uiProps.targetOrigin);
      });

      // Show pattern state.
      if (patternState) {
        const patternStateItem = '<span class=\'sg-pattern-state ' + patternState + '\'>' + patternState + '</span>';

        $('#sg-code-pattern-state-fill').html(patternStateItem);
        $sgCodePatternstate.css('display', 'block');
      }
      else {
        $sgCodePatternstate.css('display', 'none');
      }

      // Fill in the name of the pattern.
      $('#sg-code-lineage-pattern-name, #sg-code-lineager-pattern-name, #sg-code-pattern-state-pattern-name')
        .html(patternPartial);

      // Get the file name of the pattern so we can get the various editions of the code that can show in code view.
      const filename = window.patternPaths[patternPartial];
      const patternExtension = window.config.patternExtension || '.mustache';

      // Request the encoded markup version of the pattern.
      const e = new XMLHttpRequest();
      e.onload = codeViewer.saveEncoded;
      e.onerror = codeViewer.printXHRError;
      e.open('GET', filename.replace(/\.html/, '.markup-only.html') + '?' + (new Date()).getTime(), true);
      e.send();

      // Request the Mustache markup version of the pattern.
      const m = new XMLHttpRequest();
      m.onload = codeViewer.saveMustache;
      m.onerror = codeViewer.printXHRError;
      m.open('GET', filename.replace(/\.html/, patternExtension) + '?' + (new Date()).getTime(), true);
      m.send();

      // Move the code into view.
      codeViewer.slideCode(0);
    }
  };

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

    if (data.codeOverlay) {
      if (data.codeOverlay === 'on') {
        // Can assume we're not viewing the Mustache Browser.
        codeViewer.mustacheBrowser = false;

        // Make sure the annotations overlay is off before showing code view.
        window.annotationsViewer.annotationsActive = false;

        uiProps.sgTAnnotations.classList.remove('active');
        window.annotationsViewer.slideAnnotations($sgCodeContainer.outerHeight());

        // Make codeViewer and nav reflect that code view is active.
        codeViewer.codeActive = true;
        codeViewer.viewall = data.viewall || false;
        uiProps.sgTCode.classList.add('active');

        // Update code.
        codeViewer.updateCode(data.lineage, data.lineageR, data.patternPartial, data.patternState);
      }
      else {
        codeViewer.closeCode();
      }
    }
    else if (typeof data.codeMustacheBrowser === 'boolean') {
      codeViewer.mustacheBrowser = data.codeMustacheBrowser;
    }
    else if (typeof data.codeViewall === 'boolean') {
      codeViewer.viewall = data.codeViewall;
    }

    switch (data.event) {
      case 'patternlab.keyPress':
        switch (data.keyPress) {
          case 'ctrl+shift+c':
            codeViewer.toggleCode();

            break;

          case 'ctrl+alt+m':
          case 'ctrl+shift+u':
            codeViewer.swapCode('m');

            break;

          case 'ctrl+alt+h':
          case 'ctrl+shift+y':
            codeViewer.swapCode('e');

            break;

          case 'mod+a':
            codeViewer.selectCode();

            break;

          case 'esc':
            if (codeViewer.codeActive) {
              codeViewer.closeCode();
            }

            break;
        }

        break;
    }
  }

  window.addEventListener('message', receiveIframeMessage, false);

  $document.ready(function () {
    const config = window.config;

    // Initialize the code viewer.
    codeViewer.codeContainerInit();

    // Load the query strings in case code view has to show by default.
    const searchParams = uiProps.searchParams;

    if (searchParams.view === 'code' || searchParams.view === 'c') {
      codeViewer.copyOnInit = (searchParams.copy === 'true') ? true : false;
      codeViewer.openCode();
    }

    // Open code panel on page load if config.defaultShowPatternInfo === true.
    else if (config.defaultShowPatternInfo) {
      codeViewer.openCode();
    }

    // On window resize, adjust the distance with which to hide the panel.
    $(window).resize(
      uiFns.debounce(
        function () {
          const bottomDist = parseInt($sgCodeContainer.css('bottom'), 10);

          if (Number.isNaN(bottomDist) || bottomDist === 0) {
            return;
          }

          codeViewer.slideCode($sgCodeContainer.outerHeight());
        }
      )
    );

    // Toggle the code panel.
    Mousetrap.bind('ctrl+shift+c', function (e) {
      e.preventDefault();
      codeViewer.toggleCode();

      return false;
    });

    // When the code panel is open hijack, cmd+a/ctrl+a so that it only selects the code view.
    Mousetrap.bind('mod+a', function (e) {
      if (codeViewer.codeActive) {
        e.preventDefault();
        codeViewer.selectCode();

        return false;
      }
    });

    // Open the mustache panel.
    // ctrl+shift+u is a Pattern Lab convention.
    Mousetrap.bind(['ctrl+alt+m', 'ctrl+shift+u'], function (e) {
      e.preventDefault();

      codeViewer.swapCode('m');

      return false;
    });

    // Open the html panel.
    // ctrl+shift+y is a Pattern Lab convention.
    Mousetrap.bind(['ctrl+alt+h', 'ctrl+shift+y'], function (e) {
      e.preventDefault();

      codeViewer.swapCode('e');

      return false;
    });
  });
})(document, window.FEPPER_UI.uiProps, window.FEPPER_UI.uiFns);
