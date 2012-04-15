/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cc, Ci } = require("chrome");

exports.Helpers = {
  getAnchorElement: function(name) {
    let browserWindow = Cc["@mozilla.org/appshell/window-mediator;1"].
                    getService(Ci.nsIWindowMediator).
                    getMostRecentWindow("navigator:browser");
    let anchors = browserWindow.document.querySelectorAll('#addon-bar > toolbaritem'),
        len = anchors.length;
    let anchor = null;

    for(let index = 0, anc; index < len, anc = anchors[index]; index++) {
      if(anc.getAttribute("label") === name) {
        anchor = anc;
      }
    }

    return anchor;

  },

  prepareItems: function(items) {
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
};

