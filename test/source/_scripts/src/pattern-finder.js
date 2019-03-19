/**
 * Copyright (c) 2014 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license
 */
((d, uiProps, uiFns) => {
  'use strict';

  const Mousetrap = window.Mousetrap;
  const patternPaths = window.patternPaths;
  let $sgFToggle;
  let $sgFind;
  let $sgFindTypeahead;

  function closeFinder() {
    $sgFToggle.removeClass('active');
    $sgFind.removeClass('active');
  }

  class PatternFinder {
    constructor() {
      this.data = [];

      for (let patternPartial in patternPaths) {
        if (!patternPaths.hasOwnProperty(patternPartial)) {
          continue;
        }

        const obj = {
          patternPartial,
          patternPath: patternPaths[patternPartial]
        };

        this.data.push(obj);
      }

      // Instantiate the bloodhound suggestion engine.
      const Bloodhound = window.Bloodhound;
      this.patterns = new Bloodhound({
        datumTokenizer: function (data) {
          return Bloodhound.tokenizers.nonword(data.patternPartial);
        },
        queryTokenizer: Bloodhound.tokenizers.nonword,
        limit: 10,
        local: this.data
      });

      // Initialize the bloodhound suggestion engine.
      this.patterns.initialize();
    }

    closeFinder() {
      closeFinder();
      $sgFindTypeahead.blur();
    }

    // Need to pass PatternFinder instance because "this" gets overridden.
    onAutocompleted(e, item, patternFinder) {
      patternFinder.passPath(item);
    }

    // Need to pass PatternFinder instance because "this" gets overridden.
    onSelected(e, item, patternFinder) {
      patternFinder.passPath(item);
    }

    passPath(item) {
      const obj = {
        event: 'patternlab.updatePath',
        path: item.patternPath
      };

      // Update the iframe via the history api handler.
      this.closeFinder();
      uiProps.sgViewport.contentWindow.postMessage(obj, uiProps.targetOrigin);
    }

    toggleFinder() {
      $sgFToggle.toggleClass('active');
      $sgFind.toggleClass('active');

      if ($sgFToggle.hasClass('active')) {
        $sgFindTypeahead.focus();
      }
    }
  }

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
      case 'patternlab.keyPress':
        switch (data.keyPress) {
          case 'ctrl+shift+f':
            window.patternFinder.toggleFinder();

            break;

          case 'esc':
            window.patternFinder.closeFinder();

            break;
        }

        break;
    }
  }

  window.addEventListener('message', receiveIframeMessage, false);

  $(d).ready(function () {
    const patternFinder = window.patternFinder = new PatternFinder();

    $sgFToggle = $('#sg-f-toggle');
    $sgFind = $('#sg-find');
    $sgFindTypeahead = $sgFind.find('#typeahead');

    $sgFToggle.click(function (e) {
      e.preventDefault();

      uiFns.closeOtherPanels(this);
      patternFinder.toggleFinder();
    });

    $sgFToggle.mouseenter(function () {
      $sgFToggle.addClass('mouseentered');
    });

    $sgFToggle.mouseleave(function () {
      $sgFToggle.removeClass('mouseentered');
    });

    $sgFindTypeahead.typeahead(
      {highlight: true},
      {displayKey: 'patternPartial', source: patternFinder.patterns.ttAdapter()}
    ).on(
      'typeahead:selected',
      ((patternFinder_) => {
        return function (e, item) {
          patternFinder_.onSelected(e, item, patternFinder_);
        };
      })(patternFinder)
    ).on(
      'typeahead:autocompleted',
      ((patternFinder_) => {
        return function (e, item) {
          patternFinder_.onAutocompleted(e, item, patternFinder_);
        };
      })(patternFinder)
    );

    $sgFindTypeahead.blur(function () {
      if (!$sgFToggle.hasClass('mouseentered')) {
        closeFinder(); // Do not invoke an infinite loop by calling patternFinder.closeFinder().
      }
    });

    Mousetrap.bind('ctrl+shift+f', function (e) {
      e.preventDefault();
      patternFinder.toggleFinder();

      return false;
    });

    Mousetrap($sgFindTypeahead[0]).bind('ctrl+shift+f', function (e) {
      e.preventDefault();
      patternFinder.toggleFinder();

      return false;
    });

    Mousetrap($sgFindTypeahead[0]).bind('esc', function () {
      patternFinder.closeFinder();
    });
  });
})(document, window.FEPPER_UI.uiProps, window.FEPPER_UI.uiFns);
