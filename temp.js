
    if (navigator.userAgent.includes("Line") && !window.location.search.includes("openExternalBrowser=1")) {
      window.location.replace(window.location.href + (window.location.search ? "&" : "?") + "openExternalBrowser=1");
    }
  