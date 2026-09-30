// Blur-up for screenshots, the same effect as askfunnel.com: until a screenshot
// has loaded, its reserved space shows a tiny blurred preview of it (the
// <name>.blur.webp next to every image, made by tools/embed-images.mjs), and
// the sharp image fades in over it. Mintlify runs this after the page is
// interactive, so images that are already loaded are left alone. Pages change
// without a reload, so new images are picked up as they appear.
(function () {
  var SELECTOR = 'img[data-path^="images/"], img[src^="/images/"]';

  function previewUrl(img) {
    var path = img.getAttribute("data-path") || img.getAttribute("src") || "";
    path = path.split("?")[0].replace(/^\//, "");
    if (!/^images\/.+\.png$/.test(path)) return null;
    return "/" + path.replace(/\.png$/, ".blur.webp");
  }

  function prepare(img) {
    // The lightbox shows a copy of an image that is already on the page.
    if (img.dataset.afBlur || img.closest("[data-ramka-content]")) return;
    if (img.complete && img.naturalWidth > 0) return;
    var url = previewUrl(img);
    if (!url) return;
    img.dataset.afBlur = "1";
    img.style.backgroundImage = 'url("' + url + '")';
    img.classList.add("af-blur");
    function done() {
      img.classList.add("af-blur-done");
      setTimeout(function () {
        img.classList.remove("af-blur", "af-blur-done");
        img.style.backgroundImage = "";
      }, 500);
    }
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  }

  var queued = false;
  function scan() {
    queued = false;
    document.querySelectorAll(SELECTOR).forEach(prepare);
  }
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
  }

  scan();
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
})();
