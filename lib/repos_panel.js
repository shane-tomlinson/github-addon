/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {data} = require("self");
const {Panel} = require("panel");

function getReposPanel() {
  let repoPanel = Panel({
    width: 400,
    height: 700,
    contentURL: data.url("repos.html"),
    contentScriptFile: [ data.url("mustache.js"), data.url("shared.js"), data.url("repos.js") ]
  });

  return repoPanel;
}

exports.get = getReposPanel;
