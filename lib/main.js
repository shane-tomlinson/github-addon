const widgets = require("widget");
const tabs = require("tabs");
const config = require("./config").config;
const data = require("self").data;
const Request = require("request").Request;
const timers = require("timers");
const BASE_URL = "https://api.github.com/repos/" + config.repo_url;
const notifications = require("notifications");

var openIssues = 0;

var issuePanel = require("panel").Panel({
  width: 400,
  height: 700,
  contentURL: data.url("issues.html"),
  contentScriptFile: [ data.url("mustache.js"), data.url("issues.js") ]
});

function getIssues(opts, callback) {
  opts = opts || {};
  opts.state = opts.state || "open";
  opts.per_page = opts.per_page || config.page_size;

  var urlString = "";
  var optsArr = [];
  for(var key in opts) {
    optsArr.push(encodeURIComponent(key) + "=" + encodeURIComponent(opts[key]));
  }

  if(optsArr.length) {
    urlString += "?" + optsArr.join("&");
  }

  var url = BASE_URL + "/issues" + urlString;

  Request({
    url: url,
    onComplete: function(response) {
      callback(response.json);
    }
  }).get();
}

function showIssues(issues) {
  issues.forEach(function(issue, index) {
    if(index % 2) {
      issue.class = "odd";
    }
  });

  issuePanel.port.emit("show_issues", {
    issues: issues
  });
}


function getLabels(callback) {
  var url = BASE_URL + "/labels";
  Request({
    url: url,
    onComplete: function(response) {
      var labels = response.json;
      labels.splice(0, 0, {
        name: "all"
      });

      labels.forEach(function(label, index) {
        if(index % 2) {
          label.odd = true;
        }
      });

      callback(labels);

    }
  }).get();
}

function showLabels(labels) {
  issuePanel.port.emit("show_labels", {
    labels: labels
  });
}

issuePanel.on("show", function() {
  issuePanel.port.emit("initialize", {
    repo_url: config.repo_url
  });

  getLabels(showLabels);
  Pages.pageChange();
});

var Pages = {
  currPage: 1,
  prev: function() {
    if(this.currPage > 1) {
      this.currPage--;
      this.pageChange();
    }
  },

  next: function() {
    if(this.currPage < Math.ceil(openIssues / config.page_size)) {
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

    if(this.currPage === 1) {
      issuePanel.port.emit("first_page");
    }
    else {
      issuePanel.port.emit("not_first_page");
    }

    if(this.currPage === Math.ceil(openIssues / config.page_size)) {
      issuePanel.port.emit("last_page");
    }
    else {
      issuePanel.port.emit("not_last_page");
    }
  }
};

issuePanel.port.on("open_link", function(data) {
  var parts = data.href.split("/");
  var href = parts[0];
  var filter = parts[1];

  console.log("opening link: " + data.href);
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
    default:
      issuePanel.hide();
      tabs.open(data.href);
      break;
  }
});




var widget = widgets.Widget({
  id: "external-link",
  label: config.name,
  contentURL: config.favicon,
  panel: issuePanel
});


function getIssuesCount(callback) {
  var issuesRequest = Request({
    url: BASE_URL,
    onComplete: function(response) {
      var count = response.json.open_issues;
      callback(count);
    }
  }).get();
}

function getIssue(issue, callback) {
  var issuesRequest = Request({
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
          title: "New issue for " + config.repo_url,
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
