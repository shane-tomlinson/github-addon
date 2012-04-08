self.port.on("show_repos", displayRepos);

function displayRepos(data) {
  var anchor = document.querySelector("h1 > a");
  anchor.setAttribute("href", "https://github.com/" + data.username);
  anchor.innerHTML = data.username;

  var view = { repos: data.repos };
  var template = document.querySelector("#templateRepos").innerHTML;
  var html = Mustache.render(template, view);

  var listEl = document.querySelector("#main_list");
  listEl.innerHTML = html;
  attachListeners(listEl);

  window.scrollTo(0, 0);
}

attachListeners(document);
