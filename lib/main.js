/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const widgets = require("widget");
const tabs = require("tabs");
const {config} = require("./config");
const {data} = require("self");
const {Panel} = require("panel");
const {Paging} = require("./paging");
const {Issues} = require("./issues");
const {Repos} = require("./repos");
const {Labels} = require("./labels");
const {Helpers} = require("./helpers");
const {prefs} = require("simple-prefs");
const IssuesPanel = require("./issues_panel");
const ReposPanel = require("./repos_panel");
const PreferencesPanel = require("./preferences_panel");

let repo_url = prefs.repo_url;
let openIssues = 0;

let paging;
function getPaging() {
  if(!paging) {
    paging = new Paging({ page_size: prefs.page_size });
    paging.on("page_change", updateIssues);
  }
  return paging;
}

let issuePanel;
function getIssuePanel() {
  if(!issuePanel) {
    issuePanel = IssuesPanel.get();

    issuePanel.on("show", initializeIssuePanelData);
    issuePanel.port.on("open_link", handleLinks);
    issuePanel.port.on("right_click_link", handleRightClickLink);
    issuePanel.port.on("search", handleSearch);
  }
  return issuePanel;
}

function initializeIssuePanelData() {
  issuePanel.port.emit("initialize", {
    repo_url: prefs.repo_url
  });

  getLabels(showLabels);
}


let repoPanel;
function getRepoPanel() {
  if(!repoPanel) {
    repoPanel = ReposPanel.get();
    repoPanel.port.on("open_link", handleLinks);
  }
  return repoPanel;
}

let preferencePanel;
function getPreferencesPanel() {
  if(!preferencePanel) {
    preferencePanel = PreferencesPanel.get();
    preferencePanel.port.on("submit", showRepoPanel);
  }
  return preferencePanel;
}

let gettingIssues = false;
function updateIssues(page) {
  if(!gettingIssues) {
    gettingIssues = true;
    getIssuesCount(issueCountUpdate.bind(null, page));
    getIssues({ page: page }, function(issues) {
      gettingIssues = false;
      showIssues(issues);
    });
  }
}

function getIssues(opts, callback) {
  Issues.get(opts, function(issues) {
    callback && callback(prepareItems(issues));
  });
}

function showIssues(issues) {
  getIssuePanel().port.emit("show_issues", {
    issues: issues
  });
}

function getLabels(callback) {
  Labels.get(function(labels) {
    callback && callback(prepareItems(labels));
  });
}

function showLabels(labels) {
  getIssuePanel().port.emit("show_labels", {
    labels: labels
  });
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

function hidePanels(panel) {
  if(preferencePanel && panel !== preferencePanel) preferencePanel.hide();
  if(repoPanel && panel !== repoPanel) repoPanel.hide();
  if(issuePanel && panel !== issuePanel) issuePanel.hide();
}

function showPanel(panel) {
  hidePanels(panel);
  panel.show(getPanelAnchor());
}

function showIssuePanel() {
  if(!prefs.repo_url) {
    showRepoPanel();
  }
  else {
    updateIssues(paging.page);
    showPanel(getIssuePanel());
  }
}

function issueCountUpdate(currPage, count) {
  let issuePanel = getIssuePanel();

  if(currPage === 1) {
    issuePanel.port.emit("first_page");
  }
  else {
    issuePanel.port.emit("not_first_page");
  }

  let lastPage = Math.ceil(openIssues / prefs.page_size);
  if(currPage === lastPage || !lastPage) {
    issuePanel.port.emit("last_page");
  }
  else {
    issuePanel.port.emit("not_last_page");
  }
}

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
  return Helpers.getAnchorElement(config.name);
}

function showRepoPanel() {
  if(!prefs.username) {
    showPreferencesPanel();
  }
  else {
    let repoPanel = getRepoPanel();
    showPanel(repoPanel);
    getRepos(function(repos) {
      let data = {
        repos: repos,
        username: prefs.username
      }
      repoPanel.port.emit("show_repos", data);
    });
  }
}


function setRepo(repo_url) {
  Repos.set(repo_url);
  getPaging().setPage(1);
}

function getRepos(callback) {
  Repos.getWatched(function(repos) {
    callback && callback(prepareItems(repos));
  });
}

function handleLinks(data) {
  let parts = data.href.split("/");
  let href = parts[0];
  let filter = parts[1];
  let repo = parts[2];
  let paging = getPaging();

  switch(href) {
    case "#label":
      if(filter == "all") {
        paging.setPage(1);
      }
      else {
        getIssues({ labels: filter }, showIssues);
      }
      break;
    case "#prev_page":
      paging.prev();
      break;
    case "#next_page":
      paging.next();
      break;
    case "#repo":
      let repo_url = parts[1] + "/" + parts[2];
      setRepo(repo_url);
      showIssuePanel();
      break;
    default:
      hidePanels();
      tabs.open(data.href);
      break;
  }
}

function handleRightClickLink(data) {
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
}

function handleSearch(data) {
  Issues.search(data.search, function(issues) {
    showIssues(prepareItems(issues));
  });
}


function getIssuesCount(callback) {
  if(prefs.repo_url) {
    Issues.getCount(function(count) {
      openIssues = count;
      callback && callback(count);
    });
  }
}

function showPreferencesPanel() {
  let panel = getPreferencesPanel();
  showPanel(panel);
}

