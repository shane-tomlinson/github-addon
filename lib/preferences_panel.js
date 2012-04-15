/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {data} = require("self");
const {Panel} = require("panel");
const {prefs} = require("simple-prefs");

function getPreferencesPanel() {
  let preferencePanel = Panel({
    width: 400,
    height: 700,
    contentURL: data.url("preferences.html"),
    contentScriptFile: [ data.url("shared.js"), data.url("preferences.js") ]
  });

  preferencePanel.port.on("submit", handlePreferencesSubmit);

  let prefsCopy = {
    username: prefs.username,
    repo_url: prefs.repo_url,
    page_size: prefs.page_size
  };

  preferencePanel.port.emit("initialize", prefsCopy);
  return preferencePanel;
}

function handlePreferencesSubmit(data) {
  for(let key in data) {
    prefs[key] = data[key];
  }
}

exports.get = getPreferencesPanel;
