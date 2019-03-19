/**
 * Write timestamp to cookie to test whether the same timestamp was written to the file system of the Express server.
 * In this way, we can verify that the browser and server are on the same machine.
 */
$(document).ready(function () {
  'use strict';

  const fepperTs = $.cookie('fepper_ts') || '0';
  const paramsStr = window.location.search;
  let timestamp;

  if (paramsStr) {
    const paramsObj = new URLSearchParams(paramsStr.slice(1));
    timestamp = paramsObj.get('ts');
  }

  // Only write timestamp to cookie if the cookie doesn't exist or if the timestamp is greater than the cookie value.
  if (timestamp && parseInt(timestamp, 10) > parseInt(fepperTs, 10)) {
    $.cookie('fepper_ts', timestamp, {expires: 365, path: '/'});
  }
});
