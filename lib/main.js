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
const {Helpers} = require("./helpers");
const {prefs} = require("simple-prefs");
const IssuesPanel = require("./issues_panel");
const ReposPanel = require("./repos_panel");
const PreferencesPanel = require("./preferences_panel");

let repo_url = prefs.repo_url;

let paging;
function getPaging() {
  if(!paging) {
    paging = new Paging({ page_size: prefs.page_size });
    paging.on("page_change", setPage);
  }
  return paging;
}

let issuePanel;
function getIssuePanel() {
  if(!issuePanel) {
    issuePanel = IssuesPanel.get();

    // TODO - move all this to issues_panel.js
    issuePanel.port.on("open_link", handleLinks);
    issuePanel.port.on("right_click_link", handleRightClickLink);
    issuePanel.port.on("search", handleSearch);
  }
  return issuePanel;
}


function setPage(page) {
  showIssues({ page: page });
}

function showIssues(opts) {
  getIssuePanel().setFilter(opts);
}


let repoPanel;
function getRepoPanel() {
  if(!repoPanel) {
    repoPanel = ReposPanel.get();
    // TODO - move this to repos_panel.js
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


function prepareItems(items) {
  return Helpers.prepareItems(items);
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
    setPage(paging.page);
    showPanel(getIssuePanel());
  }
}

function issueCountUpdate(currPage, count) {
  getIssuePanel().setIssueCount(currPage, count);
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
    showPanel(getRepoPanel());
  }
}


function setRepo(repo_url) {
  Repos.set(repo_url);
  getPaging().setPage(1);
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
        showIssues({ labels: filter });
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
  showIssues({ search: data.search });
}


function showPreferencesPanel() {
  let panel = getPreferencesPanel();
  showPanel(panel);
}

