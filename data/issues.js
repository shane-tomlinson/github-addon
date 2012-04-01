self.port.on("initialize", function(data) {
  var header = document.querySelector("h1 a");
  header.setAttribute("href", "https://github.com/" + data.repo_url);
  header.innerHTML = data.repo_url;
});

self.port.on("show_issues", function(arg) {
  displayIssues(arg.issues || []);
  attachListeners();
});

function displayIssues(issues) {
  var view = { issues: issues };
  var template = document.querySelector("#templateIssue").innerHTML;
  var html = Mustache.render(template, view);

  var listEl = document.querySelector("#issues");
  listEl.innerHTML = html;
  window.scrollTo(0, 0);
}

function attachListeners(listEl) {
  var anchors = document.querySelectorAll("a");
  var len = anchors.length;

  for(var index = 0, anchor; index < len, anchor = anchors[index]; index++) {
    anchor.addEventListener("click", function(event) {
      event.preventDefault();
      var href = this.getAttribute("href");
      self.port.emit("open_link", { href: href });
    }.bind(anchor), false);
  }
}
