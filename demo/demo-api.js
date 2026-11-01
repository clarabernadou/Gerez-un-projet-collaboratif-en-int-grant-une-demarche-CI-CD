/*
 * Mode démo de BobApp.
 * La route de l’API Spring Boot (api/joke) est simulée dans le navigateur :
 * chaque appel renvoie une blague tirée au hasard dans le fichier jokes.json
 * du projet, comme le fait le back-end. L’application appelle l’API avec un
 * chemin relatif, que ce script intercepte.
 */
(function () {
  'use strict';

  var API_PATH = /(?:^|\/)api\/joke(?:[?#].*)?$/;
  var BANNER_KEY = 'bobapp_demo_banner';
  var JOKES_URL = new URL('jokes.json', document.currentScript.src).href;
  var RESPONSE_DELAY = 120;

  var nativeFetch = window.fetch.bind(window);
  var nativeOpen = XMLHttpRequest.prototype.open;
  var nativeSend = XMLHttpRequest.prototype.send;
  var jokes = null;

  function loadJokes() {
    if (!jokes) {
      jokes = nativeFetch(JOKES_URL)
        .then(function (response) { return response.json(); })
        .then(function (data) { return data.jokes; });
    }
    return jokes;
  }

  function finish(xhr, url, payload) {
    var text = JSON.stringify(payload);
    var fields = {
      readyState: 4,
      status: 200,
      statusText: 'OK',
      responseURL: url,
      responseText: text,
      response: xhr.responseType === 'json' ? payload : text
    };
    Object.keys(fields).forEach(function (key) {
      Object.defineProperty(xhr, key, { value: fields[key], configurable: true });
    });
    xhr.getAllResponseHeaders = function () { return 'content-type: application/json\r\n'; };
    xhr.getResponseHeader = function (name) { return /^content-type$/i.test(name) ? 'application/json' : null; };
    xhr.dispatchEvent(new Event('readystatechange'));
    xhr.dispatchEvent(new ProgressEvent('load'));
    xhr.dispatchEvent(new ProgressEvent('loadend'));
  }

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__demo = API_PATH.test(String(url)) && String(method).toUpperCase() === 'GET' ? { url: String(url) } : null;
    if (this.__demo) {
      return nativeOpen.call(this, method, window.location.href);
    }
    return nativeOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    var demo = this.__demo;
    if (!demo) {
      return nativeSend.apply(this, arguments);
    }
    var xhr = this;
    loadJokes().then(function (list) {
      var joke = list[Math.floor(Math.random() * list.length)];
      window.setTimeout(function () { finish(xhr, demo.url, joke); }, RESPONSE_DELAY);
    });
  };

  function showBanner() {
    try {
      if (window.sessionStorage.getItem(BANNER_KEY) === 'closed') {
        return;
      }
    } catch (error) { /* sessionStorage indisponible */ }
    var banner = document.createElement('div');
    banner.setAttribute('role', 'note');
    banner.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;max-width:340px;padding:10px 12px;' +
      'border-radius:10px;background:#1f2933;color:#fff;font:13px/1.45 Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35)';
    banner.innerHTML = '<strong>Version de démonstration</strong> : l’API est simulée dans votre navigateur. ' +
      'Les blagues proviennent du fichier <code style="color:#9fd0ff">jokes.json</code> du projet.<br>' +
      '<a href="#" data-close style="color:#9fd0ff">Fermer</a>';
    banner.querySelector('[data-close]').addEventListener('click', function (event) {
      event.preventDefault();
      try { window.sessionStorage.setItem(BANNER_KEY, 'closed'); } catch (error) { /* ignoré */ }
      banner.remove();
    });
    document.body.appendChild(banner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
