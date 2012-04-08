const { Cc, Ci } = require("chrome");
const widgets = require("widget");
const tabs = require("tabs");
const {config} = require("./config");
const {data} = require("self");
const {Request} = require("request");
const timers = require("timers");
const notifications = require("notifications");
const {Panel} = require("panel");
const SimplePrefs = require("simple-prefs");

let prefs = SimplePrefs.prefs;
let repo_url = prefs.repo_url;
let BASE_URL = "https://api.github.com/repos/" + prefs.repo_url;
let openIssues = 0;

let issuePanel;
function getIssuePanel() {
  if(!issuePanel) {
    issuePanel = Panel({
      width: 400,
      height: 700,
      contentURL: data.url("issues.html"),
      contentScriptFile: [ data.url("mustache.js"), data.url("shared.js"), data.url("issues.js") ]
    });

    issuePanel.on("show", function() {
      issuePanel.port.emit("initialize", {
        repo_url: prefs.repo_url
      });

      getLabels(showLabels);
      Pages.pageChange();
    });

    issuePanel.port.on("open_link", handleLinks);
    issuePanel.port.on("right_click_link", function(data) {
      let parts = data.href.split("/");
      let href = parts[0];

      switch(href) {
        case "#repo":
          showRepoPanel();
          break;
        default:
          // do nothing
          break;
      }
    });

    issuePanel.port.on("search", function(data) {
      var searchTerm = data.search.replace(/[\t ]+/, " ").replace(" ", "+");

      getLabels(function(labels) {
        var labelsHash = getLabelsHash(labels);
        var url = "http://github.com/api/v2/json/issues/search/" + prefs.repo_url + "/open/" + searchTerm;
        console.log(url);
        Request({
          url: url,
          onComplete: function(response) {
            // Issues by default come back in chronological order
            var issues = prepareItems(response.json.issues).reverse();
            issues.forEach(function(issue) {
              issue.assignee = {
                avatar_url: "http://www.gravatar.com/avatar/" + issue.gravatar_id,
                login: issue.user
              };

              var labels = issue.labels || [],
                  newLabels = [];

              issue.labels = newLabels;

              labels.forEach(function(label) {
                console.log("converting label: " + label);
                newLabels.push(labelsHash[label]);
              });
            });
            showIssues(issues);
          }
        }).get();
      });
    });
  }
  return issuePanel;
}

let repoPanel;
function getRepoPanel() {
  if(!repoPanel) {
    repoPanel = Panel({
      width: 400,
      height: 700,
      contentURL: data.url("repos.html"),
      contentScriptFile: [ data.url("mustache.js"), data.url("shared.js"), data.url("repos.js") ]
    });
    repoPanel.port.on("open_link", handleLinks);
  }
  return repoPanel;
}

function getIssues(opts, callback) {
  opts = opts || {};
  opts.state = opts.state || "open";
  opts.per_page = opts.per_page || prefs.page_size;

  let urlString = "";
  let optsArr = [];
  for(let key in opts) {
    optsArr.push(encodeURIComponent(key) + "=" + encodeURIComponent(opts[key]));
  }

  if(optsArr.length) {
    urlString += "?" + optsArr.join("&");
  }

  let url = BASE_URL + "/issues" + urlString;

  console.log("requesting: " + url);
  Request({
    url: url,
    onComplete: function(response) {
      callback(prepareItems(response.json));
    }
  }).get();
}

function prepareItems(items) {
  items = items || [];
  try {
    items.forEach(function(item, index) {
      if(index % 2) {
        item.class = "odd";
      }
    });
  }
  catch(e) {
    console.log("bad jiji");
    items = [];
  }

  return items;
}

function showIssues(issues) {
  getIssuePanel().port.emit("show_issues", {
    issues: issues
  });
}


function getLabels(callback) {
  let url = BASE_URL + "/labels";
  Request({
    url: url,
    onComplete: function(response) {
      let labels = prepareItems(response.json);
      labels.splice(0, 0, {
        name: "all"
      });

      callback(labels);

    }
  }).get();
}

function showLabels(labels) {
  getIssuePanel().port.emit("show_labels", {
    labels: labels
  });
}

function showIssuePanel() {
  getRepoPanel().hide();
  getIssuePanel().show(getPanelAnchor());
}

let Pages = {
  currPage: 1,
  prev: function() {
    if(this.currPage > 1) {
      this.currPage--;
      this.pageChange();
    }
  },

  next: function() {
    if(this.currPage < Math.ceil(openIssues / prefs.page_size)) {
      this.currPage++;
      this.pageChange();
    }
  },

  setPage: function(page) {
    this.currPage = page;
    this.pageChange();
  },

  pageChange: function() {
    getIssues({ page: this.currPage }, showIssues);
    let issuePanel = getIssuePanel();

    if(this.currPage === 1) {
      issuePanel.port.emit("first_page");
    }
    else {
      issuePanel.port.emit("not_first_page");
    }

    if(this.currPage === Math.ceil(openIssues / prefs.page_size)) {
      issuePanel.port.emit("last_page");
    }
    else {
      issuePanel.port.emit("not_last_page");
    }
  }
};

let widget = widgets.Widget({
  id: "github-widget",
  label: config.name,
  contentURL: config.favicon,
  contentScriptFile: data.url("chrome_widget.js"),
  onClick: function() {
    showIssuePanel();
  }
});
widget.port.on("show_context_menu", showRepoPanel);


function getPanelAnchor() {
  let browserWindow = Cc["@mozilla.org/appshell/window-mediator;1"].
                  getService(Ci.nsIWindowMediator).
                  getMostRecentWindow("navigator:browser");
  let anchors = browserWindow.document.querySelectorAll('#addon-bar > toolbaritem'),
      len = anchors.length;
  let anchor = null;

  for(let index = 0, anc; index < len, anc = anchors[index]; index++) {
    if(anc.getAttribute("label") === "GitHub Addon Issues") {
      anchor = anc;
    }
  }

  return anchor;
}

function showRepoPanel() {
  getIssuePanel().hide();
  getRepoPanel().show(getPanelAnchor());
  getRepos(function(repos) {
    let data = {
      repos: repos,
      username: prefs.username
    }
    getRepoPanel().port.emit("show_repos", data);
  });
}


function setRepo(repo_url) {
  prefs.repo_url = repo_url;
  BASE_URL = "https://api.github.com/repos/" + repo_url;
}

function getRepos(callback) {
  let owner = prefs.username;
  let url = "https://api.github.com/users/" + owner + "/watched";
  let issuesRequest = Request({
    url: url,
    onComplete: function(response) {
      let repos = prepareItems(response.json);
      repos.forEach(function(repo) {
        repo.owner = repo.owner.login;
      });
      callback(repos);
    }
  }).get();
}

function handleLinks(data) {
  let parts = data.href.split("/");
  let href = parts[0];
  let filter = parts[1];
  let repo = parts[2];

  switch(href) {
    case "#label":
      if(filter == "all") {
        Pages.setPage(1);
      }
      else {
        getIssues({ labels: filter }, showIssues);
      }
      break;
    case "#prev_page":
      Pages.prev();
      break;
    case "#next_page":
      Pages.next();
      break;
    case "#repo":
      let repo_url = parts[1] + "/" + parts[2];
      setRepo(repo_url);
      showIssuePanel();
      break;
    default:
      getRepoPanel().hide();
      getIssuePanel().hide();
      tabs.open(data.href);
      break;
  }
}

function getLabelsHash(labels) {
  let labelsHash = {};
  labels = labels || [];

  labels.forEach(function(label) {
    labelsHash[label.name] = label;
  });

  return labelsHash;
}


function getIssuesCount(callback) {
  let issuesRequest = Request({
    url: BASE_URL,
    onComplete: function(response) {
      let count = response.json.open_issues;
      callback(count);
    }
  }).get();
}

function getIssue(issue, callback) {
  let issuesRequest = Request({
    url: BASE_URL + "/issues/" + (issue + 1),
    onComplete: function(response) {
      callback(response.json);
    }
  }).get();

}

function checkIssuesCount() {
  getIssuesCount(function(count) {
    while(openIssues < count) {
      getIssue(openIssues, function(issue) {
        notifications.notify({
          title: "New issue for " + prefs.repo_url,
          text: issue.title + " " + issue.body,
          onClick: function() {
            tabs.open(issue.html_url)
          }
        });
      });
      openIssues++;
    }
  });
}

getIssuesCount(function(count) {
  openIssues = count;
});

timers.setInterval(checkIssuesCount, config.new_issue_interval);
