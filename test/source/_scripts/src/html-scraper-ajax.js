(() => {
  'use strict';

  function nodeListToJson(nodeItem, jsonToRecurse) {
    switch (nodeItem.nodeType) {
      case 1:
        jsonToRecurse.node = 'element';

        if (typeof nodeItem.nodeName === 'string') {
          jsonToRecurse.tag = nodeItem.nodeName.toLowerCase();
        }

        if (nodeItem.attributes.length) {
          jsonToRecurse.attr = {};

          for (let i = 0, l = nodeItem.attributes.length; i < l; i++) {
            const attribute = nodeItem.attributes[i];
            jsonToRecurse.attr[attribute.name] = attribute.value;
          }
        }

        break;

      case 3:
        jsonToRecurse.node = 'text';
        jsonToRecurse.text = nodeItem.textContent;

        break;

      case 8:
        jsonToRecurse.node = 'comment';
        jsonToRecurse.text = nodeItem.textContent;

        break;

      default:
        jsonToRecurse.node = '';
    }

    if (nodeItem.childNodes.length) {
      jsonToRecurse.child = [];

      for (let i = 0, l = nodeItem.childNodes.length; i < l; i++) {
        jsonToRecurse.child.push({});
        nodeListToJson(nodeItem.childNodes[i], jsonToRecurse.child[i]);
      }
    }
  }

  /**
   * Validate syntax of Target Selector input.
   *
   * @param {string} selectorRaw_ - CSS selector plus optional array index.
   * @returns {string|null} The selector name or null if invalid.
   */
  function selectorValidateAndParse(selectorRaw_) {
    const selectorRaw = selectorRaw_.trim();
    const bracketOpenPos = selectorRaw.indexOf('[');
    const bracketClosePos = selectorRaw.indexOf(']');

    let indexStr;
    let name = selectorRaw;

    // Slice selectorRaw to extract name and indexStr if submitted.
    if (bracketOpenPos > -1) {
      if (bracketClosePos === selectorRaw.length - 1) {
        indexStr = selectorRaw.slice(bracketOpenPos + 1, bracketClosePos);
        name = selectorRaw.slice(0, bracketOpenPos);
      }
      else {
        return null;
      }
    }

    // Validate that name is a css selector.
    // eslint-disable-next-line no-useless-escape
    if (!/^(#|\.)?[_a-z][\w#\-\.]*$/i.test(name)) {
      return null;
    }

    // If indexStr if submitted, validate it is an integer.
    if (indexStr) {
      if (!/^\d+$/.test(indexStr)) {
        return null;
      }
    }

    return name;
  }

  /* MAIN EXECUTION */

  // Since the HTML scraper won't work on GitHub Pages or any non-Express served environment, we can safely assume that
  // Fepper will be served from the document root.
  const baseUrl = window.location.protocol + '//' + window.location.host;
  const d = document;

  // First, make sure the HTML scraper is being requested from the same machine that's running the Express app.
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', baseUrl + '/gatekeeper', true);
    xhr.onload = () => {
      if (xhr.responseText) {
        resolve();
      }
      else {
        reject();
      }
    };
    xhr.send();
  })

  .then(() => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.open('GET', baseUrl + '/html-scraper-xhr' + window.location.search, true);
      xhr.onload = () => {
        // Parse xhr.responseText into DOM object.
        const parser = new DOMParser();
        const doc = parser.parseFromString(xhr.responseText, 'text/html');
        const helpText = doc.getElementById('help-text');
        const messageToRender = doc.getElementById('message');
        // Get last form on page. Older Fepper versions didn't identify it by name.
        const scraperTargeter = doc.forms[doc.forms.length - 1];

        // Write out any messaging.
        const messageSlug = d.getElementById('message');

        if (messageSlug && messageToRender.innerHTML) {
          messageSlug.outerHTML = messageToRender.outerHTML;
        }

        // Append targeter form and help text.
        const main = d.getElementsByTagName('main')[0];
        main.innerHTML += scraperTargeter.outerHTML;
        main.innerHTML += helpText.outerHTML;

        // Insert new script element such that it fires on load.
        const node4insert = d.getElementById('help-text');

        if (node4insert) {
          const script2insert = d.createElement('script');
          script2insert.src = baseUrl + '/node_modules/fepper-ui/scripts/html-scraper-dhtml.js';

          node4insert.parentNode.insertBefore(script2insert, node4insert);
        }

        resolve();
      };
      xhr.send();
    });
  })

  .then(() => {
    // Get last form on page. Older Fepper versions didn't identify it by name.
    const scraperTargeter = d.forms[d.forms.length - 1];

    scraperTargeter.addEventListener(
      'submit',
      function (e) {
        e.preventDefault();

        const message = d.getElementById('message');
        const xhr = new XMLHttpRequest();
        const selectorRaw = scraperTargeter.selector.value;
        const url = scraperTargeter.url.value;

        xhr.open('GET', baseUrl + '/html-scraper-xhr/cors?url=' + encodeURIComponent(url), true);
        xhr.onload = () => {
          // Fail and return on error.
          if (xhr.readyState === 4 && xhr.status === 200) {
            const selectorName = selectorValidateAndParse(selectorRaw);

            if (!selectorName) {
              message.className = 'message error';
              message.innerHTML = 'Error! Please enter correctly syntaxed selector.';
              d.body.scrollTop = d.documentElement.scrollTop = 0;

              return;
            }

            // Parse xhr.responseText as DOM. Create an object consumable by the html2json library.
            const parser = new DOMParser();
            const doc = parser.parseFromString(xhr.responseText, 'text/html');
            const selection = doc.querySelectorAll(selectorName);
            const html2json = {node: 'root', child: []};

            for (let i = 0, l = selection.length; i < l; i++) {
              html2json.child.push({});
              nodeListToJson(selection[i], html2json.child[i]);
            }

            message.className = 'message';
            message.innerHTML = '';

            scraperTargeter.html2json.value = JSON.stringify(html2json);
            scraperTargeter.submit();
          }
          else {
            message.className = 'message error';
            message.innerHTML = 'Error! Please enter a valid, reachable URL.';
            d.body.scrollTop = d.documentElement.scrollTop = 0;
          }
        };
        xhr.send();
      },
      false
    );
  })

  .catch(() => {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', baseUrl + '/html-scraper-xhr/forbidden' + window.location.search, true);
    xhr.onload = () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xhr.responseText, 'text/html');
      const forbidden = doc.getElementById('forbidden');
      const main = d.getElementsByTagName('main')[0];
      main.innerHTML = forbidden.outerHTML;
    };
    xhr.send();
  });
})();
