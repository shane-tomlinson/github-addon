(function() {
  "use strict";

  function calculate() {
    // This bit does some magic to keep the footer at the bottom of the panel
    // if the content is smaller than the screen height, and let the footer be
    // part of the normal flow if the content is larger than the screen height.
    var footer = document.querySelector("footer");
    if(footer) {
      footer.style.position = "static";

      var bodyHeight = document.body.clientHeight;
      var winHeight = window.innerHeight;

      if(bodyHeight < winHeight) {
        footer.style.position = "fixed";
        footer.style.bottom = "0";
      }
    }
  }

  window.FooterHacks = {
    calculate: calculate
  };
}());

