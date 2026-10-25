// Builds the gallery from the file list GitHub Pages writes into index.html,
// and runs the copy / download buttons.
(function () {
  "use strict";

  var IMAGE_FILE = /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i;
  var BRANCH = "main";
  // Used only when the page is opened somewhere other than github.io.
  var FALLBACK_REPO = "msiemiatkowski/qualtrics-images";

  var repo = repoFromAddress() || FALLBACK_REPO;
  var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  var gallery = document.getElementById("gallery");
  var filter = document.getElementById("filter");
  var count = document.getElementById("count");
  var actionButtons = ["copy-all", "download-csv", "copy-preload"].map(function (id) {
    return document.getElementById(id);
  });
  var groups = [];

  document.getElementById("add-images").href = "https://github.com/" + repo + "/upload/" + BRANCH + "/images";
  document.getElementById("manage-images").href = "https://github.com/" + repo + "/tree/" + BRANCH + "/images";

  var fileList = document.getElementById("file-list");
  var items = [].slice.call(fileList.querySelectorAll("li"))
    .map(function (li) { return li.getAttribute("data-path") || ""; })
    .filter(function (path) { return IMAGE_FILE.test(path); })
    .map(toItem)
    .sort(compareItems);

  render();
  filter.addEventListener("input", applyFilter);

  document.getElementById("copy-all").addEventListener("click", function () {
    var urls = visibleItems().map(function (item) { return item.url; });
    copy(urls.join("\n"), urls.length === 1 ? "1 link copied" : urls.length + " links copied");
  });
  document.getElementById("download-csv").addEventListener("click", function () {
    download("image-links.csv", csv(visibleItems()));
  });
  document.getElementById("copy-preload").addEventListener("click", function () {
    var urls = visibleItems().map(function (item) { return item.url; });
    copy(preloadCode(urls), "Preload code copied (" + urls.length + (urls.length === 1 ? " image)" : " images)"));
  });

  // owner/repo, read from an address like owner.github.io/repo/.
  function repoFromAddress() {
    var host = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    if (!host) return null;
    var first = location.pathname.split("/")[1];
    var name = first && first !== "index.html" ? decodeURIComponent(first) : host[1] + ".github.io";
    return host[1] + "/" + name;
  }

  function toItem(path) {
    var parts = path.replace(/^\/+/, "").split("/"); // ["images", "folder", "file.png"]
    return {
      name: parts[parts.length - 1],
      folder: parts.slice(1, -1).join("/"),
      path: parts.join("/"),
      url: new URL(parts.map(encodeURIComponent).join("/"), document.baseURI).href,
      search: parts.slice(1).join("/").toLowerCase()
    };
  }

  // Top-level images first, then folders A-Z; "img2" sorts before "img10".
  function compareItems(a, b) {
    if (a.folder !== b.folder) {
      if (!a.folder) return -1;
      if (!b.folder) return 1;
      return collator.compare(a.folder, b.folder);
    }
    return collator.compare(a.name, b.name);
  }

  function render() {
    if (!items.length) {
      var unbuilt = fileList.textContent.indexOf("{%") !== -1;
      gallery.appendChild(el("p", "empty", unbuilt
        ? "The image list is filled in by GitHub Pages, so it is empty when this file is opened directly."
        : "No images yet. Click Add images to upload some."));
      updateCount();
      return;
    }
    var group = null;
    items.forEach(function (item) {
      if (!group || group.folder !== item.folder) {
        group = makeGroup(item.folder);
        groups.push(group);
        gallery.appendChild(group.section);
      }
      var card = makeCard(item);
      group.cards.push({ item: item, el: card });
      group.list.appendChild(card);
    });
    applyFilter();
  }

  function makeGroup(folder) {
    var section = el("section", "group");
    var heading = el("h2");
    var label = el("span", "folder", folder ? "images/" + folder : "images");
    var groupCount = el("span", "group-count");
    heading.appendChild(label);
    heading.appendChild(groupCount);
    var list = el("ul", "grid");
    section.appendChild(heading);
    section.appendChild(list);
    return { folder: folder, section: section, list: list, count: groupCount, cards: [] };
  }

  function makeCard(item) {
    var card = el("li", "card");

    var thumb = el("a", "thumb");
    thumb.href = item.url;
    thumb.target = "_blank";
    thumb.rel = "noopener";
    thumb.title = "Open full size";
    var img = el("img");
    img.src = item.url;
    img.alt = item.name;
    img.loading = "lazy";
    img.decoding = "async";
    thumb.appendChild(img);

    var name = el("p", "name", item.name);
    name.title = item.path;

    var link = el("input", "url");
    link.type = "text";
    link.readOnly = true;
    link.value = item.url;
    link.setAttribute("aria-label", "Link to " + item.name);
    link.addEventListener("focus", function () { link.select(); });

    var actions = el("div", "actions");
    actions.appendChild(button("Copy link", function () { copy(item.url, "Link copied"); }));
    actions.appendChild(button("Copy HTML", function () { copy(imgTag(item.url), "HTML copied"); }));

    card.appendChild(thumb);
    card.appendChild(name);
    card.appendChild(link);
    card.appendChild(actions);
    return card;
  }

  function applyFilter() {
    var query = filter.value.trim().toLowerCase();
    groups.forEach(function (group) {
      var shown = 0;
      group.cards.forEach(function (card) {
        var match = !query || card.item.search.indexOf(query) !== -1;
        card.el.hidden = !match;
        if (match) shown++;
      });
      group.section.hidden = shown === 0;
      group.count.textContent = plural(shown, "image");
    });
    updateCount();
  }

  function visibleItems() {
    var visible = [];
    groups.forEach(function (group) {
      group.cards.forEach(function (card) {
        if (!card.el.hidden) visible.push(card.item);
      });
    });
    return visible;
  }

  function updateCount() {
    var shown = visibleItems().length;
    count.textContent = shown === items.length
      ? plural(items.length, "image")
      : shown + " of " + plural(items.length, "image");
    actionButtons.forEach(function (b) { b.disabled = shown === 0; });
  }

  function imgTag(url) {
    return '<img src="' + url + '" alt="" style="max-width: 100%; height: auto;">';
  }

  function csv(list) {
    var rows = [["folder", "file", "url"]].concat(list.map(function (item) {
      return [item.folder, item.name, item.url];
    }));
    return rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n") + "\r\n";
  }

  function csvCell(value) {
    return /[",\r\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
  }

  function preloadCode(urls) {
    return [
      "Qualtrics.SurveyEngine.addOnload(function () {",
      "  // Downloads these images in the background so they show instantly later in the survey.",
      "  var urls = " + JSON.stringify(urls, null, 2).replace(/\n/g, "\n  ") + ";",
      "  window.preloadedImages = (window.preloadedImages || []).concat(urls.map(function (src) {",
      "    var img = new Image();",
      "    img.src = src;",
      "    return img;",
      "  }));",
      "});",
      ""
    ].join("\n");
  }

  function download(filename, text) {
    // The byte-order mark makes Excel read accented file names correctly.
    var blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
    var a = el("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function copy(text, message) {
    function failed() { toast("Couldn't copy. Select the text and copy it by hand."); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast(message); }, function () {
        if (copyWithTextarea(text)) toast(message); else failed();
      });
    } else if (copyWithTextarea(text)) {
      toast(message);
    } else {
      failed();
    }
  }

  function copyWithTextarea(text) {
    var area = el("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  var toastTimer;
  function toast(message) {
    var box = document.getElementById("toast");
    box.textContent = message;
    box.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove("show"); }, 2000);
  }

  function button(label, onClick) {
    var b = el("button", "btn small", label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function plural(n, word) {
    return n + " " + word + (n === 1 ? "" : "s");
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
})();
