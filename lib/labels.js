/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Request} = require("request");
const {Repos} = require("./repos");

exports.Labels = {
  get: function(callback) {
    let url = Repos.BASE_URL + "/labels";
    Request({
      url: url,
      onComplete: function(response) {
        let labels = response.json;
        labels.splice(0, 0, {
          name: "all"
        });

        callback(labels);
      }
    }).get();
  }
};
