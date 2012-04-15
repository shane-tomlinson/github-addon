/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Request} = require("request");
const {Repos} = require("./repos");
const {Labels} = require("./labels");
const {prefs} = require("simple-prefs");

exports.Issues = {
  get: getIssues,
  search: search,
  getCount: getCount
};

function getIssues(opts, callback) {
  opts = opts || {};
  opts.state = opts.state || "open";
  opts.per_page = opts.per_page || prefs.page_size;

  let url = Repos.BASE_URL + "/issues" + getURLString(opts);

  console.log("requesting: " + url);
  Request({
    url: url,
    onComplete: function(response) {
      var result = {
        issues: response.json
      };

      var linksHeader = response.headers.Link;
      if(linksHeader) {
        var links = convertLinkHeaderToLinks(linksHeader);
        result.links = links;
      }

      callback && callback(result);
    }
  }).get();
}

function convertLinkHeaderToLinks(linkHeader) {
  // Link header is of the format:
  // <https://api.github.com/repos/mozilla/browserid/issues?labels=%E2%98%85%E2%98%85%E2%98%85&page=2>;
  // rel="next",
  // <https://api.github.com/repos/mozilla/browserid/issues?labels=%E2%98%85%E2%98%85%E2%98%85&page=5>;
  // rel="last"
  var links = {},
      linkStrs = linkHeader.split(", ");

  for(var linkStr, index = 0; linkStr = linkStrs[index]; ++index) {
    var pageInfo = /page=(\d+)/.exec(linkStr),
        page = pageInfo && pageInfo[1],
        relInfo = /rel="(\w+)"/.exec(linkStr),
        rel = relInfo && relInfo[1];

    if(typeof rel !== "undefined" && typeof page !== "undefined") {
      links[rel] = ~~page;
    }
  }

  return links;
}

function getCount(callback) {
  let issuesRequest = Request({
    url: Repos.BASE_URL,
    onComplete: function(response) {
      let count = response.json.open_issues;
      callback && callback(count);
    }
  }).get();
}

function search(search_term, callback) {
  let searchTerm = search_term.replace(/[\t ]+/, " ").replace(" ", "+");

  let url = "http://github.com/api/v2/json/issues/search/" + prefs.repo_url + "/open/" + searchTerm;
  console.log(url);
  Request({
    url: url,
    onComplete: function(response) {
      convertV2toV3(response.json.issues, callback);
    }
  }).get();
}

function convertV2toV3(issues, callback) {
  if(issues && issues.length) {
    Labels.get(function(labels) {
      let labelsHash = getLabelsHash(labels);
      // Issues by default come back in chronological order
      issues = issues.reverse();
      issues.forEach(function(issue) {
        issue.assignee = {
          avatar_url: "http://www.gravatar.com/avatar/" + issue.gravatar_id,
          login: issue.user
        };

        let labels = issue.labels || [],
            newLabels = [];

        issue.labels = newLabels;

        labels.forEach(function(label) {
          newLabels.push(labelsHash[label]);
        });

        callback && callback({ issues: issues });
      });
    });
  }
  else {
    callback && callback(issues);
  }
}

function getLabelsHash(labels) {
  let labelsHash = {};
  labels = labels || [];

  labels.forEach(function(label) {
    labelsHash[label.name] = label;
  });

  return labelsHash;
}

function getURLString(opts) {
  let urlString = "";
  let optsArr = [];
  for(let key in opts) {
    optsArr.push(encodeURIComponent(key) + "=" + encodeURIComponent(opts[key]));
  }

  if(optsArr.length) {
    urlString += "?" + optsArr.join("&");
  }
  return urlString;
}

