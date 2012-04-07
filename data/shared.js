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


