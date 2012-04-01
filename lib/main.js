const widgets = require("widget");
const tabs = require("tabs");
const config = require("./config").config;
const data = require("self").data;
const Request = require("request").Request;
const timers = require("timers");
const BASE_URL = "https://api.gethub.org/repos/" + config.repo_url + "/";
const notifications = require("notifications");

var issuePanel = require("panel").Panel({
  width: 400,
  height: 700,
  contentURL: data.url("issues.html"),
  contentScriptFile: [ data.url("mustache.js"), data.url("issues.js") ]
});

issuePanel.on("show", function() {
  var url = BASE_URL + "issues?state=open";
  var issuesRequest = Request({
    url: url,
    onComplete: function(response) {
      issuePanel.port.emit("show", {
        issues: response.json
      });
    }
  }).get();
});

issuePanel.port.on("open_issue", function(data) {
  tabs.open(data.href);
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
      callback(response.open_issues);
    }
  }).get();
}

var openIssues;
getIssuesCount(function(count) {
  openIssues = count;
});

timers.setInterval(function() {
  getIssuesCount(function(count) {
    if(count !== openIssues) {
      notifications.notify({
        title: "new issue"
      });

      openIssues = count;
    }
  });
}, config.new_issue_interval);
