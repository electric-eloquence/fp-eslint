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
  const viewall = Boolean(sgPatternToggleAnnotations.length);

  // Before declaring and running anything else, tell the viewer whether this is a viewall or not.
  if (viewall) {
    parent.postMessage({annotationsViewall: viewall}, targetOrigin);
  }

  /**
   * Annotations support for patterns.
   */
  const annotationsPattern = {
    annotations: [],
    annotationsActive: false,
    bodyWidth: d.body.clientWidth,
    viewallFocus: '',

    activateAnnotationTips: () => {
      let count = 0;
      let context;

      if (viewall) {
        context = d.getElementById(annotationsPattern.viewallFocus);
      }
      else {
        context = d;
      }

      if (!context) {
        return;
      }

      for (let annotation of window.annotations) {
        const els = context.querySelectorAll(annotation.el);

        if (els.length) {
          count++;
          annotation.displayNumber = count;

          els.forEach((el) => {
            el.querySelectorAll('.annotation-tip').forEach((tip) => {
              tip.addEventListener(
                'click',
                ((annotation_) => {
                  return function (e) {
                    if (annotationsPattern.annotationsActive) {
                      e.preventDefault();
                      e.stopPropagation();

                      // If an element was clicked while the overlay was already on, swap it.
                      const obj = {annotationNumber: annotation_.displayNumber};

                      parent.postMessage(obj, targetOrigin);
                    }
                  };
                })(annotation),
                false
              );
            });
          });
        }
      }
    },

    hideAnnotationTips: () => {
      const elsToHideFlag = d.querySelectorAll('.has-annotation');

      elsToHideFlag.forEach((el) => {
        el.classList.remove('has-annotation');
      });

      const elsToHideTip = d.querySelectorAll('.annotation-tip');

      elsToHideTip.forEach((el) => {
        el.style.display = 'none';
      });
    },

    scrollViewall: () => {
      const focusedEl = d.querySelector('.sg-pattern-toggle-annotations.focused');

      if (focusedEl) {
        focusedEl.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
      }
      else {
        sgPatternFirst.querySelector('.sg-pattern-toggle-annotations').classList.add('focused');
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

    if (data.annotationsToggle) {
      if (data.annotationsToggle === 'on') {
        annotationsPattern.annotations = [];
        annotationsPattern.annotationsActive = true;

        let count = 0;
        let patternPartial = '';

        for (let annotation of window.annotations) {
          let els;
          let state = false;

          if (viewall) {
            for (let el of sgPatternToggleAnnotations) {
              if (el.classList.contains('focused')) {
                patternPartial = el.dataset.patternpartial || '';

                if (!patternPartial) {
                  break;
                }

                annotationsPattern.viewallFocus = patternPartial;
                const sgPattern = d.getElementById(patternPartial);

                if (!sgPattern) {
                  break;
                }

                els = sgPattern.querySelectorAll(annotation.el);

                break;
              }
            }

            if (!els) {
              els = sgPatternFirst.querySelectorAll(annotation.el);
            }
          }

          // Pattern.
          else {
            const patternDataEl = d.getElementById('sg-pattern-data-footer');
            let patternData = {};

            try {
              patternData = JSON.parse(patternDataEl.innerHTML);
            }
            catch (err) {
              // Fail gracefully.
            }

            els = d.querySelectorAll(annotation.el);
            patternPartial = patternData.patternPartial || '';
          }

          // Loop through all elements with annotations within the query scope.
          if (els.length) {
            count++;

            for (let el of els) {
              // Display tips within the scoped element.
              const annotationTip = el.querySelector('.annotation-tip');

              if (annotationTip) {
                annotationTip.style.display = 'inline';
              }
              else {
                const span = d.createElement('span');
                span.innerHTML = count;

                span.classList.add('annotation-tip');

                if (window.getComputedStyle(el, null).getPropertyValue('max-height') === '0px') {
                  span.style.display = 'none';
                  state = false;
                }

                el.classList.add('has-annotation');
                el.insertBefore(span, el.firstChild);
              }

              // If any annotated element is visible, set state = true.
              if (getComputedStyle(el).getPropertyValue('max-height') !== '0px') {
                state = true;
              }
            }

            annotationsPattern.annotations.push({
              el: annotation.el,
              title: annotation.title,
              annotation: annotation.annotation,
              number: count,
              state: state
            });
          }
        }

        annotationsPattern.activateAnnotationTips();

        const obj = {
          annotationsOverlay: 'on',
          annotations: annotationsPattern.annotations,
          patternPartial,
          viewall
        };

        parent.postMessage(obj, targetOrigin);
      }

      // data.annotationsToggle off.
      else {
        annotationsPattern.annotationsActive = false;
        annotationsPattern.hideAnnotationTips();
      }
    }
    else if (data.annotationsScrollViewall) {
      annotationsPattern.scrollViewall();
    }
  }

  window.addEventListener('message', receiveIframeMessage, false);

  let debounceTimeout = null;

  window.addEventListener(
    'resize',
    function () {
      // Debounce.
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(
        function () {
          // Do not fire if viewer is closed.
          if (!annotationsPattern.annotationsActive) {
            return;
          }

          // Do not fire if body height has changed, but body width has not, e.g. when the viewer opens or closes.
          if (annotationsPattern.bodyWidth === d.body.clientWidth) {
            return;
          }

          annotationsPattern.bodyWidth = d.body.clientWidth;

          for (let annotation of annotationsPattern.annotations) {
            let els;

            if (viewall) {
              const sgPattern = d.getElementById(annotationsPattern.viewallFocus);
              els = sgPattern.querySelectorAll(annotation.el);
            }

            // Pattern.
            else {
              els = d.querySelectorAll(annotation.el);
            }

            // The main reason for invoking this function on resize - to indicate whether annotated elements are hidden
            // or not. Start with state = false. If any annotated element is visible, then state = true.
            annotation.state = false;

            if (els.length) {
              for (let el of els) {
                if (window.getComputedStyle(el, null).getPropertyValue('max-height') !== '0px') {
                  annotation.state = true;
                }
              }
            }
          }

          const obj = {
            annotationsOverlay: 'on',
            annotations: annotationsPattern.annotations,
            viewall
          };

          parent.postMessage(obj, targetOrigin);
        },
        200
      );
    },
    false
  );

  // Tell the viewer that keyboard shortcuts were pressed.
  // Toggle the annotations panel.
  Mousetrap.bind('ctrl+shift+a', function (e) {
    e.preventDefault();

    const obj = {event: 'patternlab.keyPress', keyPress: 'ctrl+shift+a'};

    parent.postMessage(obj, targetOrigin);

    return false;
  });

  // Close the annotations panel if using escape.
  Mousetrap.bind('esc', function () {
    const obj = {event: 'patternlab.keyPress', keyPress: 'esc'};

    parent.postMessage(obj, targetOrigin);
  });

  // Add click listeners to toggles on viewall.
  sgPatternToggleAnnotations.forEach((el) => {
    el.addEventListener(
      'click',
      function (e) {
        e.preventDefault();

        sgPatternToggleAnnotations.forEach((el) => {
          el.classList.remove('focused');
        });

        this.classList.add('focused');

        if (this.classList.contains('active')) {
          this.classList.remove('active');
          annotationsPattern.hideAnnotationTips();
          parent.postMessage({annotationsOverlay: 'off'}, targetOrigin);
        }
        else {
          sgPatternToggleAnnotations.forEach((el) => {
            el.classList.remove('active');
          });
          sgPatternToggleCode.forEach((el) => {
            el.classList.remove('active');
          });

          this.classList.add('active');
          annotationsPattern.hideAnnotationTips();
          parent.postMessage({annotationsViewallClick: true}, targetOrigin);
          annotationsPattern.scrollViewall();
        }
      },
      false
    );
  });
})(document);
