/**
 * Copyright (c) 2013-2014 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license.
 */
((d) => {
  'use strict';

  const Mousetrap = window.Mousetrap;
  const sgPatternFirst = d.querySelector('.sg-pattern');
  const sgPatternToggleAnnotations = d.querySelectorAll('.sg-pattern-toggle-annotations');
  const sgPatternToggleCode = d.querySelectorAll('.sg-pattern-toggle-code');
  const targetOrigin =
    (window.location.protocol === 'file:') ? '*' : window.location.protocol + '//' + window.location.host;
  const viewall = Boolean(sgPatternToggleCode.length);

  // Before declaring and running anything else, tell the viewer whether this is a viewall or not.
  if (viewall) {
    parent.postMessage({codeViewall: viewall}, targetOrigin);
  }

  /**
   * Code view support for patterns.
   */
  const codePattern = {
    codeActive: false,
    viewallFocus: '',

    scrollViewall: () => {
      const focusedEl = d.querySelector('.sg-pattern-toggle-code.focused');

      if (focusedEl) {
        focusedEl.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
      }
      else {
        if (!sgPatternFirst) {
          parent.postMessage({annotationsViewall: false, codeViewall: false, targetOrigin});

          return;
        }

        sgPatternFirst.querySelector('.sg-pattern-toggle-code').classList.add('focused');
        window.scrollTo({top: 0, behavior: 'smooth'});
      }
    }
  };

  /**
   * This gets attached as an event listener, so do not use arrow function notation.
   * This cannot use uiFns.receiveIframeMessageBoilerplate because this file does not load uiFns.
   *
   * @param {object} event - Event object.
   */
  function receiveIframeMessage(event) {
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

    if (data.codeToggle) {

      // Get and post data for selected pattern.
      if (data.codeToggle === 'on') {
        codePattern.codeActive = true;

        const sgPatterns = d.querySelectorAll('.sg-pattern');
        let obj;

        if (viewall) {
          let patternData;

          sgPatterns.forEach((el) => {
            const sgPatternToggle = el.querySelector('.sg-pattern-toggle-code');

            if (!sgPatternToggle || !sgPatternToggle.classList.contains('focused')) {
              return;
            }

            const patternDataEl = el.querySelector('.sg-pattern-data');

            if (patternDataEl) {
              try {
                patternData = JSON.parse(patternDataEl.innerHTML);
              }
              catch (err) {
                // Fail gracefully.
              }
            }
          });

          // If none of the toggles are focused, get the data from the first one.
          if (!patternData) {
            const patternDataEl = sgPatterns[0].querySelector('.sg-pattern-data');

            if (patternDataEl) {
              try {
                patternData = JSON.parse(patternDataEl.innerHTML);
              }
              catch (err) {
                // Fail gracefully.
              }
            }
          }

          if (patternData) {
            obj = {
              codeOverlay: 'on',
              lineage: patternData.lineage,
              lineageR: patternData.lineageR,
              patternPartial: patternData.patternPartial,
              patternState: patternData.patternState,
              viewall: true
            };
          }
        }

        // Pattern.
        else {
          obj = {
            codeOverlay: 'on',
            lineage: window.lineage,
            lineageR: window.lineageR,
            patternPartial: window.patternPartial,
            patternState: window.patternState
          };
        }

        if (obj) {
          parent.postMessage(obj, targetOrigin);
        }
      }

      // data.codeToggle off.
      else {
        codePattern.codeActive = false;

        sgPatternToggleCode.forEach((el) => {
          el.classList.remove('active');
        });
      }
    }
    else if (data.codeScrollViewall) {
      codePattern.scrollViewall();
    }
  }

  // Add the click handlers to the elements that have an annotations.
  window.addEventListener('message', receiveIframeMessage, false);

  // Tell the viewer that keys were pressed.
  // Toggle the code panel.
  Mousetrap.bind('ctrl+shift+c', function (e) {
    e.preventDefault();

    const obj = {event: 'patternlab.keyPress', keyPress: 'ctrl+shift+c'};

    parent.postMessage(obj, targetOrigin);

    return false;
  });

  // Open the mustache panel.
  Mousetrap.bind('ctrl+alt+m', function (e) {
    e.preventDefault();

    const obj = {event: 'patternlab.keyPress', keyPress: 'ctrl+alt+m'};

    parent.postMessage(obj, targetOrigin);

    return false;
  });

  Mousetrap.bind('ctrl+shift+u', function (e) {
    e.preventDefault();

    const obj = {event: 'patternlab.keyPress', keyPress: 'ctrl+shift+u'};

    parent.postMessage(obj, targetOrigin);

    return false;
  });

  // Open the html panel.
  Mousetrap.bind('ctrl+alt+h', function (e) {
    e.preventDefault();

    const obj = {event: 'patternlab.keyPress', keyPress: 'ctrl+alt+h'};

    parent.postMessage(obj, targetOrigin);

    return false;
  });

  Mousetrap.bind('ctrl+shift+y', function (e) {
    e.preventDefault();

    const obj = {event: 'patternlab.keyPress', keyPress: 'ctrl+shift+y'};

    parent.postMessage(obj, targetOrigin);

    return false;
  });

  // When the code panel is open, hijack cmd+a/ctrl+a so that it only selects the code view.
  Mousetrap.bind('mod+a', function (e) {
    if (codePattern.codeActive) {
      e.preventDefault();

      const obj = {event: 'patternlab.keyPress', keyPress: 'mod+a'};

      parent.postMessage(obj, targetOrigin);

      return false;
    }
  });

  // Close the code panel if using escape.
  Mousetrap.bind('esc', function () {
    const obj = {event: 'patternlab.keyPress', keyPress: 'esc'};

    parent.postMessage(obj, targetOrigin);
  });

  sgPatternToggleCode.forEach((el) => {
    el.addEventListener(
      'click',
      function (e) {
        e.preventDefault();

        sgPatternToggleCode.forEach((el) => {
          el.classList.remove('focused');
        });

        this.classList.add('focused');

        if (this.classList.contains('active')) {
          this.classList.remove('active');
          parent.postMessage({codeOverlay: 'off'}, targetOrigin);
        }
        else {
          sgPatternToggleAnnotations.forEach((el) => {
            el.classList.remove('active');
          });
          sgPatternToggleCode.forEach((el) => {
            el.classList.remove('active');
          });

          this.classList.add('active');

          const patternPartial = this.dataset.patternpartial;
          const patternDataEl = d.getElementById(`sg-pattern-data-${patternPartial}`);
          let patternData = {};

          try {
            patternData = JSON.parse(patternDataEl.innerHTML);
          }
          catch (err) {
            // Fail gracefully.
          }

          const obj = {
            codeOverlay: 'on',
            lineage: patternData.lineage,
            lineageR: patternData.lineageR,
            patternPartial: patternData.patternPartial,
            patternState: patternData.patternState,
            viewall: true
          };

          parent.postMessage(obj, targetOrigin);

          codePattern.scrollViewall();
        }
      },
      false
    );
  });
})(document);
