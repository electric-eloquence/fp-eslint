/**
 * Copyright (c) 2013 Brad Frost, http://bradfrostweb.com & Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license.
 */
((d, uiProps, uiFns) => {
  'use strict';

  const $document = $(document);
  const $sgAnnotationsContainer = $('#sg-annotations-container');
  const Mousetrap = window.Mousetrap;

  /**
   * Annotations support for the viewer.
   */
  const annotationsViewer = window.annotationsViewer = {
    // Set-up default sections.
    annotationsActive: false,
    moveToOnInit: 0,
    mustacheBrowser: false,
    viewall: false,

    /**
     * Add the basic markup and events for the annotations container.
     */
    annotationsContainerInit: () => {
      $sgAnnotationsContainer // Has class sg-view-container.
        .css('bottom', -$document.outerHeight())
        .addClass('anim-ready');

      // Make sure the close button handles the click.
      $('#sg-annotations-close-btn').click(function (e) {
        e.preventDefault();

        const obj = {annotationsToggle: 'off'};
        annotationsViewer.annotationsActive = false;
        uiProps.sgVpWrap.style.paddingBottom = '0';

        annotationsViewer.slideAnnotations($sgAnnotationsContainer.outerHeight());
        uiProps.sgTAnnotations.classList.remove('active');
        uiProps.sgViewport.contentWindow.postMessage(obj, uiProps.targetOrigin);
      });
    },

    closeAnnotations: () => {
      const obj = {annotationsToggle: 'off'};
      annotationsViewer.annotationsActive = false;
      uiProps.sgVpWrap.style.paddingBottom = '0';

      uiProps.sgViewport.contentWindow.postMessage(obj, uiProps.targetOrigin);
      annotationsViewer.slideAnnotations($sgAnnotationsContainer.outerHeight());
      uiProps.sgTAnnotations.classList.remove('active');
    },

    /**
     * Moves to a particular item in the viewer.
     *
     * @param {number} number - Annotation element identifier.
     */
    moveTo: (number) => {
      const annotationEl = d.getElementById('annotation-' + number);

      if (annotationEl) {
        const top = annotationEl.offsetTop;

        $sgAnnotationsContainer.animate({scrollTop: top - 10}, 600);
      }
    },

    openAnnotations: () => {
      // Do nothing if viewing Mustache Browser.
      if (annotationsViewer.mustacheBrowser) {
        return;
      }

      // Make sure the code view overlay is off before showing the annotations view.
      const objCodeToggle = {codeToggle: 'off'};
      const codeViewer = window.codeViewer;
      codeViewer.codeActive = false;

      uiProps.sgTCode.classList.remove('active');
      uiProps.sgViewport.contentWindow.postMessage(objCodeToggle, uiProps.targetOrigin);
      codeViewer.slideCode($sgAnnotationsContainer.outerHeight());

      // Tell the pattern that annotations view has been turned on.
      const objAnnotationsToggle = {annotationsToggle: 'on'};

      uiProps.sgViewport.contentWindow.postMessage(objAnnotationsToggle, uiProps.targetOrigin);

      // Note that it's turned on in the viewer.
      annotationsViewer.annotationsActive = true;

      uiProps.sgTAnnotations.classList.add('active');
    },

    scrollViewall: function () {
      uiProps.sgViewport.contentWindow.postMessage({annotationsScrollViewall: true}, uiProps.targetOrigin);
    },

    /**
     * Slides the annotations panel.
     *
     * @param {number} pos - Annotation container position from bottom.
     */
    slideAnnotations: (pos) => {
      $sgAnnotationsContainer.css('bottom', -pos);
    },

    /**
     * Decide on if the annotations panel should be open or closed.
     */
    toggleAnnotations: () => {
      if (!annotationsViewer.annotationsActive) {
        annotationsViewer.openAnnotations();
      }
      else {
        annotationsViewer.closeAnnotations();
      }
    },

    /**
     * When updating the annotations panel, get the annotations from the pattern via postMessage.
     *
     * @param {array} annotations - Annotations array.
     * @param {string} patternPartial - The shorthand partials syntax for a given pattern.
     */
    updateAnnotations: (annotations, patternPartial) => {
      const sgAnnotations = d.getElementById('sg-annotations');

      // Clear out the annotations container.
      if (sgAnnotations && sgAnnotations.innerHTML !== '') {
        sgAnnotations.innerHTML = '';
      }

      // Set data-patternpartial attribute.
      $sgAnnotationsContainer.attr('data-patternpartial', patternPartial);

      // See how many annotations this pattern might have.
      // If more than zero, write them out.
      // If not, alert the user to the fact there aren't any.
      if (annotations.length) {
        for (let annotation of annotations) {
          const displayNumber = annotation.number;
          const span = d.createElement('span');
          span.id = 'annotation-state-' + displayNumber;
          span.style.fontSize = '0.8em';
          span.style.color = '#666';

          if (annotation.state === false) {
            span.innerHTML = ' hidden';
          }

          const h2 = d.createElement('h2');
          h2.innerHTML = displayNumber + '. ' + annotation.title;
          h2.appendChild(span);

          const div = d.createElement('div');
          div.innerHTML = annotation.annotation;

          const annotationDiv = d.createElement('div');
          annotationDiv.id = 'annotation-' + displayNumber;
          annotationDiv.appendChild(h2);
          annotationDiv.appendChild(div);
          annotationDiv.classList.add('sg-annotation');
          sgAnnotations.appendChild(annotationDiv);
        }
      }
      else {
        // TODO: Internationalize this.
        const h2 = d.createElement('h2');
        h2.innerHTML = 'No Annotations';

        const div = d.createElement('div');
        div.innerHTML = 'There are no annotations for this pattern.';

        const annotationDiv = d.createElement('div');
        annotationDiv.appendChild(h2);
        annotationDiv.appendChild(div);
        annotationDiv.classList.add('sg-annotation');
        sgAnnotations.appendChild(annotationDiv);
      }

      // Slide the annotation section into view.
      annotationsViewer.slideAnnotations(0);

      if (annotationsViewer.moveToOnInit !== '0') {
        annotationsViewer.moveToOnInit = '0';

        annotationsViewer.moveTo(annotationsViewer.moveToOnInit);
      }
    }
  };

  /**
   * This gets attached as an event listener, so do not use arrow function notation.
   *
   * @param {object} event - Event info.
   */
  function receiveIframeMessage(event) {
    const data = uiFns.receiveIframeMessageBoilerplate(event);

    if (!data) {
      return;
    }

    if (data.annotationsOverlay) {
      if (data.annotationsOverlay === 'on') {
        // Can assume we're not viewing the Mustache Browser.
        annotationsViewer.mustacheBrowser = false;
        annotationsViewer.viewall = data.viewall || false;

        annotationsViewer.updateAnnotations(data.annotations, data.patternPartial);
      }
      else {
        annotationsViewer.closeAnnotations();
      }
    }
    else if (data.annotationNumber) {
      annotationsViewer.moveTo(data.annotationNumber);
    }
    else if (data.annotationsViewallClick) {
      annotationsViewer.openAnnotations();
    }
    else if (typeof data.annotationsMustacheBrowser === 'boolean') {
      annotationsViewer.mustacheBrowser = data.annotationsMustacheBrowser;
    }
    else if (typeof data.annotationsViewall === 'boolean') {
      annotationsViewer.viewall = data.annotationsViewall;
    }

    switch (data.event) {
      case 'patternlab.keyPress':
        switch (data.keyPress) {
          case 'ctrl+shift+a':
            annotationsViewer.toggleAnnotations();

            break;

          case 'esc':
            if (annotationsViewer.annotationsActive) {
              annotationsViewer.closeAnnotations();
            }

            break;
        }

        break;
    }
  }

  window.addEventListener('message', receiveIframeMessage, false);

  $document.ready(function () {
    // Initialize the annotations viewer.
    annotationsViewer.annotationsContainerInit();

    // Load the query strings in case code view has to show by default.
    const searchParams = uiProps.searchParams;

    if (searchParams.view && (searchParams.view === 'annotations' || searchParams.view === 'a')) {
      annotationsViewer.openAnnotations();

      if (typeof searchParams.number !== 'undefined') {
        annotationsViewer.moveToOnInit = searchParams.number;
      }
    }

    $(window).resize(
      uiFns.debounce(
        function () {
          // On window resize, adjust the distance with which to hide the panel.
          const bottomDist = parseInt($sgAnnotationsContainer.css('bottom'), 10);

          if (Number.isNaN(bottomDist) || bottomDist === 0) {
            return;
          }

          annotationsViewer.slideAnnotations($sgAnnotationsContainer.outerHeight());
        }
      )
    );

    // Toggle the annotations panel.
    Mousetrap.bind('ctrl+shift+a', function (e) {
      e.preventDefault();
      annotationsViewer.toggleAnnotations();

      return false;
    });
  });
})(document, window.FEPPER_UI.uiProps, window.FEPPER_UI.uiFns);
