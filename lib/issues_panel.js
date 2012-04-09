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

let openIssues = 1;

exports.get = function() {
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
    getIssues(opts, showIssues.bind(null, panel));
    getIssuesCount(issueCountUpdate.bind(panel, 1));
  };

  return panel;
}

function showIssues(panel, issues) {
  panel.port.emit("show_issues", {
    issues: Helpers.prepareItems(issues)
  });
}

function getIssues(opts, callback) {
  if(opts.search) {
    Issues.search(opts.search, callback);
  }
  else {
    Issues.get(opts, callback);
  }
}

function getIssuesCount(callback) {
  if(prefs.repo_url) {
    Issues.getCount(function(count) {
      openIssues = count;
      callback && callback(count);
    });
  }
}

function issueCountUpdate(currPage) {
  if(currPage === 1) {
    this.port.emit("first_page");
  }
  else {
    this.port.emit("not_first_page");
  }

  let lastPage = Math.ceil(openIssues / prefs.page_size);
  if(currPage === lastPage || !lastPage) {
    this.port.emit("last_page");
  }
  else {
    this.port.emit("not_last_page");
  }
}


