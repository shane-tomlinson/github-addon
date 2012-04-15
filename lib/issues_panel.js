/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {data} = require("self");
const {Panel} = require("panel");
const {prefs} = require("simple-prefs");
const {Issues} = require("./issues");
const {Labels} = require("./labels");
const {Helpers} = require("./helpers");

let paging;

exports.get = function(config) {
  paging = config.paging;

  let panel = Panel({
    width: 400,
    height: 700,
    contentURL: data.url("issues.html"),
    contentScriptFile: [ data.url("mustache.js"), data.url("shared.js"), data.url("issues.js") ]
  });

  panel._origShow = panel.show;
  panel.show = function(anchor) {
    panel._origShow(anchor);

    panel.port.emit("initialize", {
      repo_url: prefs.repo_url
    });

    Labels.get(function(labels) {
      panel.port.emit("show_labels", {
        labels: Helpers.prepareItems(labels)
      });
    });
  };

  panel.setFilter = function(opts) {
    getIssues(opts, showIssues.bind(null, panel, opts));
    updateNextPrevious(panel);
  };

  panel.port.on("search", handleSearch.bind(panel));

  return panel;
}

function showIssues(panel, opts, issues) {
  panel.port.emit("show_issues", {
    issues: Helpers.prepareItems(issues),
    search_term: opts.search_term
  });
}

function getIssues(opts, callback) {
  // TODO - collapse these into a single call
  if(opts.search_term) {
    Issues.search(opts.search_term, callback);
  }
  else {
    Issues.get(opts, callback);
  }
}

function updateNextPrevious(panel) {
  Issues.getCount(function(count) {
    paging.setTotal(count);
    issueCountUpdate(panel, count, paging.page);
  });
}

function issueCountUpdate(panel, count, currPage) {
  if(currPage === 1) {
    panel.port.emit("first_page");
  }
  else {
    panel.port.emit("not_first_page");
  }

  let lastPage = Math.ceil(count / prefs.page_size);
  if(currPage === lastPage || !lastPage) {
    panel.port.emit("last_page");
  }
  else {
    panel.port.emit("not_last_page");
  }
}

function handleSearch(data) {
  var searchTerm = data.search;

  if(searchTerm) {
    this.setFilter({ search_term: searchTerm });
  }
  else {
    paging.setPage(1);
  }
}


