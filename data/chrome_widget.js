var body = document.querySelector("body");
if(body) {
    body.addEventListener("mousedown", function(event) {
      if(event.button === 2) {
        self.port.emit("show_context_menu");
      }
    }, false);
}

