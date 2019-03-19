/**
 * Copyright (c) 2013-2016 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license.
 */
((d, uiProps, uiFns) => {
  'use strict';

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
      case 'patternlab.updatePath':
        window.location.replace('../../' + data.path);

        break;
    }
  }

  window.addEventListener('message', receiveIframeMessage, false);

  // If there are clicks within the pattern, make sure the nav in the viewer closes.
  d.body.addEventListener(
    'click',
    function () {
      parent.postMessage({event: 'patternlab.bodyClick'}, uiProps.targetOrigin);
    },
    false
  );

  // Find all links and add a click handler for replacing the address so the history works.
  const aTags = d.querySelectorAll('a');

  for (let aTag of aTags) {
    aTag.addEventListener(
      'click',
      function (e) {
        if (this.classList.contains('fp-express')) {
          return;
        }

        e.preventDefault();

        // Use .getAttribute() to get raw "#" value, and not the full URL from the .href property.
        const href = aTag.getAttribute('href');

        if (!href || href === '#') {
          return;
        }

        // Do not navigate outside this domain from within the iframe.
        if (aTag.hostname !== window.location.hostname) {
          return;
        }

        window.location.replace(href);
      },
      false
    );
  }

  // Mousetrap keyboard shortcuts.
  const Mousetrap = window.Mousetrap;

  // Bind the keyboard shortcuts using ctrl+alt.
  const keysAlt = ['0', 'g', 'h', 'l', 'm', 'r', 'w'];

  for (let i = 0; i < keysAlt.length; i++) {
    Mousetrap.bind(
      'ctrl+alt+' + keysAlt[i],
      ((key) => {
        return function (e) {
          e.preventDefault();

          const obj = {event: 'patternlab.keyPress', keyPress: 'ctrl+alt+' + key};
          parent.postMessage(obj, uiProps.targetOrigin);

          return false;
        };
      })(keysAlt[i])
    );
  }

  // Bind the keyboard shortcuts using ctrl+shift.
  const keysShift = ['0', 'a', 'c', 'd', 'f', 'l', 'm', 's', 'u', 'w', 'x', 'y'];

  for (let i = 0; i < keysShift.length; i++) {
    Mousetrap.bind(
      'ctrl+shift+' + keysShift[i],
      ((key) => {
        return function (e) {
          e.preventDefault();

          const obj = {event: 'patternlab.keyPress', keyPress: 'ctrl+shift+' + key};
          parent.postMessage(obj, uiProps.targetOrigin);

          return false;
        };
      })(keysShift[i])
    );
  }

  Mousetrap.bind('esc', function () {
    const obj = {event: 'patternlab.keyPress', keyPress: 'esc'};
    parent.postMessage(obj, uiProps.targetOrigin);
  });

  d.addEventListener(
    'DOMContentLoaded',
    function () {
      const patternDataEl = d.getElementById('sg-pattern-data-footer');
      let patternData;

      try {
        patternData = JSON.parse(patternDataEl.innerHTML);
      }
      catch (err) {
        // Fail gracefully.
      }

      // Just return if this is a viewall (or doesn't have global patternData in the footer).
      if (!patternData) {
        return;
      }

      const parts = window.location.href.split('?');
      let obj;

      // When navigating back to a pattern from the Mustache Browser, invoke patternlab.updatePatternInfo for its
      // special treatment of browser history in this instance.
      if (d.referrer.indexOf(window.location.protocol + '//' + window.location.host + '/mustache-browser') === 0) {
        obj = {
          event: 'patternlab.updatePatternInfo',
          path: parts[0],
          patternPartial: patternData.patternPartial
        };

        if (!d.getElementById('mustache-browser')) {
          obj.annotationsMustacheBrowser = false;
          obj.codeMustacheBrowser = false;
        }
      }

      // Notify the viewer what pattern this is so it updates itself appropriately.
      else {
        obj = {event: 'patternlab.pageLoad'};
        obj.patternPartial = patternData.patternPartial;

        if (patternData.lineage) {
          obj.lineage = patternData.lineage;
        }

        if (!d.getElementById('mustache-browser')) {
          obj.annotationsMustacheBrowser = false;
          obj.codeMustacheBrowser = false;
        }
      }

      parent.postMessage(obj, uiProps.targetOrigin);
    },
    false
  );
})(document, window.FEPPER_UI.uiProps, window.FEPPER_UI.uiFns);
