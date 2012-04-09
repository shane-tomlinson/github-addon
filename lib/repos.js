/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Request} = require("request");
const {prefs} = require("simple-prefs");

exports.Repos = {
  set: function(repo_url) {
    prefs.repo_url = repo_url;
    this.BASE_URL = "https://api.github.com/repos/" + repo_url;
  },

  getWatched: function(callback) {
    let owner = prefs.username;
    let url = "https://api.github.com/users/" + owner + "/watched";
    let issuesRequest = Request({
      url: url,
      onComplete: function(response) {
        let repos = response.json;
        repos.forEach(function(repo) {
          repo.owner = repo.owner.login;
        });
        callback && callback(repos);
      }
    }).get();
  }
}
