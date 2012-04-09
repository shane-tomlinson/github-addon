function attachListeners(listEl, extraListener) {
  if(!listEl) return;

  var anchors = listEl.querySelectorAll("a");
  var len = anchors.length;

  for(var index = 0, anchor; index < len, anchor = anchors[index]; index++) {
    anchor.addEventListener("mouseup", function(event) {
      if(event.button === 2) {
        var href = this.getAttribute("data-right_click_href");
        self.port.emit("right_click_link", { href: href });
      }
    }.bind(anchor));

    anchor.addEventListener("click", function(extraListener, event) {
      event.preventDefault();
      var href = this.getAttribute("href");
      self.port.emit("open_link", { href: href });
      extraListener && extraListener(event);
    }.bind(anchor, extraListener), false);
  }

}

var inputs = document.querySelectorAll("input");
for(var input, index = 0, len = inputs.length; index < len, input = inputs[index]; index++) {
  input.addEventListener("keyup", function(event) {
    handleInputElement(event.target);
  }, false);

  // Set up the initial classes
  handleInputElement(input);
}

function handleInputElement(input) {
  if(input.value !== "") {
    input.classList.add("hasValue");
  }
  else {
    input.classList.remove("hasValue");
  }
}
