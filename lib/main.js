const widgets = require("widget");
const tabs = require("tabs");
const config = require("./config").config;
const data = require("self").data;
const Request = require("request").Request;
const timers = require("timers");
const BASE_URL = "https://api.github.com/repos/" + config.repo_url;
const notifications = require("notifications");

var issuePanel = require("panel").Panel({
  width: 400,
  height: 700,
  contentURL: data.url("issues.html"),
  contentScriptFile: [ data.url("mustache.js"), data.url("issues.js") ]
});

var currPage = 1;
function getShowIssues() {
  var url = BASE_URL + "/issues?state=open&page=" + currPage + "&per_page=" + config.page_size;
  console.log("requesting: " + url);
  Request({
    url: url,
    onComplete: function(response) {
      var issues = response.json;
      issues.forEach(function(issue, index) {
        if(index % 2) {
          issue.class = "odd";
        }
      });

      issuePanel.port.emit("show_issues", {
        issues: issues
      });
    }
  }).get();
}

issuePanel.on("show", function() {
  issuePanel.port.emit("initialize", {
    repo_url: config.repo_url
  });
  getShowIssues();
});

issuePanel.port.on("open_link", function(data) {
  switch(data.href) {
    case "#prev_page":
      if(currPage > 1) currPage--;
      getShowIssues();
      break;
    case "#next_page":
      currPage++;
      getShowIssues();
      break;
    default:
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
  console.log("requesting: " + BASE_URL);
  var issuesRequest = Request({
    url: BASE_URL,
    onComplete: function(response) {
      var count = response.json.open_issues;
      console.log("open issues: " + count);
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

var openIssues = 0;

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
