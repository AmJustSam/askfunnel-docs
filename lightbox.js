// Mintlify's image lightbox (ramka) only zooms and closes with its corner
// buttons: clicking the image did nothing although the cursor promised a zoom,
// and clicking around the image did not close it. Make it behave like a normal
// lightbox: click the image to zoom in, click again to zoom all the way back
// out, click anywhere around the image to close. A press that moves (panning a
// zoomed image, pulling to dismiss on a phone) is a drag, not a click.
(function () {
  var DRAG_PX = 6;
  // The zoom buttons step one level at a time and re-render in between, so
  // stepping back out takes one click per frame (never more than a few levels).
  var MAX_ZOOM_STEPS = 8;
  var press = null;

  function clickIfEnabled(button) {
    if (button && !button.disabled) button.click();
  }

  function zoomAllTheWayOut(lightbox, steps) {
    var zoomOut = lightbox.querySelector("[data-ramka-zoom-out]");
    steps = steps || 0;
    if (!zoomOut || zoomOut.disabled || steps >= MAX_ZOOM_STEPS) return;
    zoomOut.click();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        zoomAllTheWayOut(lightbox, steps + 1);
      });
    });
  }

  document.addEventListener(
    "pointerdown",
    function (event) {
      var inLightbox = event.target.closest && event.target.closest("[data-ramka-content]");
      press = inLightbox ? { x: event.clientX, y: event.clientY } : null;
    },
    true,
  );

  document.addEventListener(
    "click",
    function (event) {
      var lightbox = event.target.closest && event.target.closest("[data-ramka-content]");
      if (!lightbox || !press) return;
      var dragged =
        Math.abs(event.clientX - press.x) > DRAG_PX || Math.abs(event.clientY - press.y) > DRAG_PX;
      press = null;
      if (dragged || event.target.closest("button")) return;

      if (event.target.closest("[data-ramka-media]")) {
        if (lightbox.hasAttribute("data-zoomed")) zoomAllTheWayOut(lightbox);
        else clickIfEnabled(lightbox.querySelector("[data-ramka-zoom-in]"));
        return;
      }
      var close = lightbox.querySelector("[data-ramka-close]");
      if (close) close.click();
    },
    true,
  );
})();
