/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { EventEmitter } = require('api-utils/events');

const Paging = EventEmitter.compose({
  page: 1,

  constructor: function(config) {
    this.page_size = config.page_size || 20;
  },

  prev: function() {
    if(this.page > 1) {
      this.page--;
      this.pageChange();
    }
  },

  next: function() {
    if(this.page < Math.ceil(openIssues / this.page_size)) {
      this.page++;
      this.pageChange();
    }
  },

  setPage: function(page) {
    this.page = page;
    this.pageChange();
  },

  pageChange: function() {
    this._emit("page_change", this.page);
  }
});

exports.Paging = Paging;
