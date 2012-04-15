var body = document.querySelector("body");

self.port.on("initialize", function(data) {
  var anchor = document.querySelector("h1 > a");
  anchor.setAttribute("href", "https://github.com/" + data.repo_url);
  anchor.setAttribute("data-right_click_href", "#repo/" + data.repo_url);
  anchor.innerHTML = data.repo_url;

  var newIssue = document.querySelector("#new_issue");
  newIssue.setAttribute("href", "https://github.com/" + data.repo_url + "/issues/new");
  FooterHacks.calculate();
});

self.port.on("show_issues", function(data) {
  if(data.search_term) {
    body.classList.add("search");
  }
  else {
    body.classList.remove("search");
  }

  displayIssues(data);
  FooterHacks.calculate();
  attachListeners();
});

self.port.on("first_page", function() {
  body.classList.add("first_page");
});

self.port.on("not_first_page", function() {
  body.classList.remove("first_page");
});

self.port.on("last_page", function() {
  body.classList.add("last_page");
});

self.port.on("not_last_page", function() {
  body.classList.remove("last_page");
});


function displayIssues(data) {
  var view = { issues: data.issues || [], search_term: data.search_term };
  var template = document.querySelector("#templateIssue").innerHTML;
  var html = Mustache.render(template, view);

  var listEl = document.querySelector("#main_list");
  listEl.innerHTML = html;
  attachListeners(listEl);

  window.scrollTo(0, 0);
}

attachListeners(document);

var form = document.querySelector("#searchform");
form.addEventListener("submit", function(event) {
  event.preventDefault();
  var searchTerm = document.querySelector("#search").value;
  if(searchTerm) {
    self.port.emit("search", { search: searchTerm });
  }
  else {
    // If no search term, assume no search and go to the "all" label.
    self.port.emit("open_link", { href: "#label/all" });
  }
});

self.port.on("show_labels", function(data) {
  displayLabels(data.labels || []);
});

function displayLabels(labels) {
  var view = { labels: labels };
  var template = document.querySelector("#templateLabels").innerHTML;
  var html = Mustache.render(template, view);

  var listEl = document.querySelector("#labels");
  listEl.innerHTML = html;

  attachListeners(listEl, function(event) {
    var currLabelEl = document.querySelector("#curr_label");
    currLabelEl.innerHTML = event.currentTarget.innerHTML;
    currLabelEl.style.color = event.currentTarget.style.color;
  });
}

