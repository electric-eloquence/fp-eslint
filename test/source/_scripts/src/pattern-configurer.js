if (document.body) {
  const reloader = document.createElement('script');
  const l = window.location;

  if (window.portReloader && window.location.protocol !== 'file:') {
    reloader.setAttribute('src', l.protocol + '//' + l.hostname + ':' + window.portReloader + '/livereload.js');
    document.body.appendChild(reloader);
  }
}
