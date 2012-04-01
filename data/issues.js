self.port.on("show", function(arg) {
  displayIssues(arg.issues || []);
  attachListeners();
});

function displayIssues(issues) {
  var view = { issues: issues };
  var template = document.querySelector("#templateIssue").innerHTML;
  var html = Mustache.render(template, view);

  var listEl = document.querySelector("#issues");
  listEl.innerHTML = html;
}

function attachListeners(listEl) {
  var anchors = document.querySelectorAll("a");
  var len = anchors.length;

  for(var index = 0, anchor; index < len, anchor = anchors[index]; index++) {
    anchor.addEventListener("click", function(event) {
      event.preventDefault();
      var href = this.getAttribute("href");
      self.port.emit("open_issue", { href: href });
    }.bind(anchor), false);
  }

}
