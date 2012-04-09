/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {data} = require("self");
const {Panel} = require("panel");
const {prefs} = require("simple-prefs");
const {Repos} = require("./repos");
const {Helpers} = require("./helpers");

function getReposPanel() {
  let panel = Panel({
    width: 400,
    height: 700,
    contentURL: data.url("repos.html"),
    contentScriptFile: [ data.url("mustache.js"), data.url("shared.js"), data.url("repos.js") ]
  });

  panel._origShow = panel.show;
  panel.show = function(anchor) {
    panel._origShow(anchor);
    getRepos(function(repos) {
      let data = {
        repos: Helpers.prepareItems(repos),
        username: prefs.username
      }
      panel.port.emit("show_repos", data);
    });
  };


  return panel;
}

function getRepos(callback) {
  Repos.getWatched(callback);
}

exports.get = getReposPanel;
