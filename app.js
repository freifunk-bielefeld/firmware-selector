/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function $(s) {
  return document.getElementById(s.substring(1));
}

function append(parent, tag) {
  var e = document.createElement(tag);
  parent.appendChild(e);
  return e;
}

function clearChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function isNonEmptyString(s) {
  return s.length !== 0;
}

function isNotUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function toggleClass(s, cssClass) {
  $(s).classList.toggle(cssClass);
}

function show_inline(s) {
  $(s).style.display = 'inline-block';
}

function show(s) {
  $(s).style.display = 'block';
}

function hide(s) {
  $(s).style.display = 'none';
}

function isStable(branch) {
  return config.stable.indexOf(branch) !== -1;
}

function isUnstable(branch) {
  return config.unstable.indexOf(branch) !== -1;
}

function isTesting(branch) {
  return config.testing.indexOf(branch) !== -1;
}

function isEmptyObject(obj) {
  for (var name in obj) {
    return false;
  }
  return true;
}

// Translate a single text id
function tr(id) {
  var mapping = translations[config.language];
  if (id in mapping) {
    return mapping[id];
  } else {
    console.log('Missing translation of token "' + id + '" (' + config.language + ')');
    return id;
  }
}

// Change the translation of the entire document
function changeTranslation() {
  var mapping = translations[config.language];
  for (var id in mapping) {
    var elements = document.getElementsByClassName(id);
    for (var i in elements) {
      if (elements.hasOwnProperty(i)) {
        elements[i].innerHTML = mapping[id];
      }
    }
  }
}

function loadFile(url, callback) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      callback(xmlhttp.responseText, url);
    }
  };
  xmlhttp.open('GET', url, true);
  xmlhttp.send();
}

var firmwarewizard = function() {
  var app = {};

  var IGNORED_ELEMENTS = [
    './', '../', 'manifest', '-tftp', '-fat', '-loader', '-NA', '-x2-', '-hsv2', '-p1020'
  ];
  var PANE = {'MODEL': 0, 'IMAGETYPE': 1, 'BRANCH': 2};

  var wizard = parseWizardObject();
  app.currentVersions = {};
  var images = {};

  function buildVendorModelsReverse() {
    var vendormodels_reverse = {};

    // Create a map of {match : [{vendor, model, default-revision}, ... ], ...}
    for (var vendor in config.vendormodels) {
      var models = config.vendormodels[vendor];
      for (var model in models) {
        var match = models[model];
        if (typeof match == 'string') {
          addToArray(vendormodels_reverse, match, {'vendor': vendor, 'model': model, 'revision': ''});
        } else for (var m in match) {
          addToArray(vendormodels_reverse, m, {'vendor': vendor, 'model': model, 'revision': match[m]});
        }
      }
    }

    return vendormodels_reverse;
  }

  function createHistoryState(wizard) {
    if (!window.history || !history.pushState) return;

    var parameters = '';
    for (var key in wizard) {
      parameters += '&' + key + '=' + encodeURIComponent(wizard[key]);
    }

    // Replace first occurence of "&" by "?"
    parameters = parameters.replace('&', '?');
    history.pushState(wizard, '', parameters);
  }

  function parseWizardObject(wizard) {
    if (wizard === undefined || wizard === null) wizard = {};
    wizard.vendor            = wizard.vendor || -1;
    wizard.model             = wizard.model || -1;
    wizard.revision          = wizard.revision || -1;
    wizard.imageType         = wizard.imageType || -1;
    wizard.showFirmwareTable = (wizard.showFirmwareTable == 'true');
    return wizard;
  }

  window.onpopstate = function(event) {
    if (event.state === null) return;
    wizard = parseWizardObject(event.state);
    updateHTML(wizard);
  };

  window.onload = function() {
    function parseURLasJSON() {
      var search = location.search.substring(1);
      return search ? JSON.parse(
        '{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}',
        function(key, value) {
          return (key === '') ? value : decodeURIComponent(value);
        }):{};
    }
    var parsedURL = parseURLasJSON();
    wizard = parseWizardObject(parsedURL);
    updateHTML(wizard);
  };

  app.genericError = function() {
    alert(tr('tr-generic-error'));
  };

  // Methods to set options

  app.setVendor = function(vendor) {
    wizard.vendor = vendor;
    wizard.model = -1;
    wizard.revision = -1;
    wizard.imageType = -1;
    createHistoryState(wizard);
    updateHTML(wizard);
  };

  app.setModel = function(model) {
    wizard.model = model;
    wizard.revision = -1;
    wizard.imageType = -1;

    if (wizard.model != -1) {
      // Skip revision selection if there is only one option left
      var revisions = getRevisions();
      if (revisions.length == 1) {
        app.setRevision(revisions[0], true);
      }
    }

    createHistoryState(wizard);
    updateHTML(wizard);
  };

  app.setRevision = function(revision, silentUpdate) {
    if (silentUpdate === undefined) {
      silentUpdate = false;
    }
    wizard.revision = revision;
    wizard.imageType = -1;
    if (!silentUpdate) {
      createHistoryState(wizard);
      updateHTML(wizard);
    }
  };

  app.setImageType = function(type) {
    wizard.imageType = type;
    createHistoryState(wizard);
    updateHTML(wizard);
  };

  app.showFirmwareTable = function() {
    wizard.showFirmwareTable = true;
    createHistoryState(wizard);
    updateHTML(wizard);
  };

  app.hideFirmwareTable = function() {
    wizard.showFirmwareTable = false;
    createHistoryState(wizard);
    updateHTML(wizard);
  };

  app.changeLanguage = function(lang) {
    if (lang in translations) {
      config.language = lang;
      changeTranslation();
      updateHTML(wizard);
    }
  };

  // Exclude file names containing specific strings
  function ignoredFileName(name) {
    for (var i in IGNORED_ELEMENTS) {
      if (name.indexOf(IGNORED_ELEMENTS[i]) != -1) {
        return true;
      }
    }
    return false;
  }

  // Simplified version string comparison
  function sortByRevision(revisions) {
    function cmpVersion(a, b) {
      var ap = a.split(/[.,-]/);
      var bp = b.split(/[.,-]/);
      for (var i = 0; i < Math.min(ap.length, bp.length); i += 1) {
        var ae = ap[i];
        var be = bp[i];
        if (ae.length > be.length) return 1;
        if (ae.length < be.length) return -1;
        if (ae > be) return 1;
        if (ae < be) return -1;
      }
      return ap.length > bp.length;
    }

    // Sort by revision first, by size second
    revisions.sort(function(a, b) {
      return cmpVersion(a.revision + a.size, b.revision + b.size)
    });
    return revisions;
  }

  function findImageType(name) {
    var m = /-(sysupgrade|factory|rootfs|kernel)[-.]/.exec(name);
    return m ? m[1] : 'factory';
  }

  function findVersion(name) {
    // Version with optional date in it (e.g. 0.8.0~20160502)
    var m = /-([0-9]+\.[0-9]+\.[0-9]+(~[0-9]+)?)[.-]/.exec(name);
    return m ? m[1] : '';
  }

  function findRevision(name) {
    // Reversion identifier like a1, v2.1
    var m = /-([a-z][0-9]{1,2}(\.[0-9]{1,2})?)[.-]/.exec(name);
    return m ? m[1] : tr('tr-all');
  }

  function findRegion(name) {
    var m = /-(cn|de|en|eu|il|jp|na|us)[.-]/.exec(name);
    return m ? m[1] : '';
  }

  function findSize(name) {
    var m = /-(256M|128M|64M|32M|16M|8M|4M)[.-]/.exec(name);
    return m ? m[1] : '';
  }

  function findFileSystem(name) {
    var m = /-(ext2|ext3|ext4|squashfs|initramfs|uImage|fat32)[-.]/.exec(name);
    return m ? m[1] : '';
  }

  function addToArray(obj, key, value) {
    if (key in obj) {
      obj[key].push(value);
    } else {
      obj[key] = [value];
    }
  }

  function parseFilePath(device, match, path, href, branch) {
    if (device.model == '--ignore--' || device.revision == '--ignore--') {
      return;
    }

    var location = path + href;
    var type = findImageType(href);
    var version = findVersion(href);
    var region = findRegion(href);
    var revision = device.revision;
    var size = findSize(href);
    var fs = findFileSystem(href);

    if (revision.length === 0) {
      revision = findRevision(href.replace(match, ''));
    }

    if (region.length) {
      revision += '-' + region;
    }

    // Collect branch versions
    app.currentVersions[branch] = version;

    if (!(device.vendor in images)) {
      images[device.vendor] = {};
    }

    addToArray(images[device.vendor], device.model, {
      revision: revision, // a1, v2.1, ..
      branch: branch, // stable, unstable, ..
      type: type, // sysupgrade, factory, ..
      version: version, // 17.01.4, ..
      location: location, // http://...
      size: size, // 8M, 16M, ...
      fs: fs // squashfs, ext3, ..
    });
  }

  function createOption(value, title, selectedOption) {
    var o = document.createElement('option');
    o.value = value;
    o.textContent = title;
    o.selected = (value === selectedOption);
    return o;
  }

  function getRevisions() {
    return sortByRevision(images[wizard.vendor][wizard.model])
      .map(function(e) { return e.revision; })
      .filter(isNotUnique);
  }

  function getImageTypes() {
    return images[wizard.vendor][wizard.model]
      .filter(function(e) { return e.revision === wizard.revision; })
      .map(function(e) { return e.type; })
      .filter(isNotUnique)
      .sort();
  }

  // Update all elements of the page according to the wizard object
  function updateHTML(wizard) {
    if (wizard.showFirmwareTable) {
      show('#firmwareTable');
      hide('#wizard');
    } else {
      show('#wizard');
      hide('#firmwareTable');
    }

    // show vendor dropdown menu.
    function showVendors() {
      var select = $('#vendorselect');
      clearChildren(select);

      select.appendChild(
        createOption(-1, tr('tr-select-manufacturer'))
      );

      var vendors = Object.keys(images).sort();
      for (var i in vendors) {
        select.appendChild(
          createOption(vendors[i], vendors[i], wizard.vendor)
        );
      }
    }
    showVendors();

    // Show model dropdown menu
    function showModels() {
      var select = $('#modelselect');
      clearChildren(select);

      select.appendChild(
        createOption(-1, tr('tr-select-model'))
      );

      if (wizard.vendor == -1 || isEmptyObject(images)) {
        return;
      }

      var models = Object.keys(images[wizard.vendor]).sort();
      for (var i in models) {
        select.appendChild(
          createOption(models[i], models[i], wizard.model)
        );
      }
    }
    showModels();

    // Show revision dropdown menu
    function showRevisions() {
      var select = $('#revisionselect');
      clearChildren(select);

      select.appendChild(
        createOption(-1, tr('tr-select-revision'), wizard.revision)
      );

      if (wizard.vendor == -1 || wizard.model == -1 || isEmptyObject(images)) {
        return;
      }

      var revisions = getRevisions();
      for (var i in revisions) {
        select.appendChild(
          createOption(revisions[i], revisions[i], wizard.revision)
        );
      }
    }
    showRevisions();

    // Show image type selection
    function showImageTypes() {
      if (wizard.model == -1 || isEmptyObject(images)) {
        return;
      }

      var typeNames = {
        factory: 'tr-factory',
        sysupgrade: 'tr-sysupgrade',
        rootfs: 'tr-rootfs',
        kernel: 'tr-kernel'
      };

      var p = $('#typeselect');
      clearChildren(p);

      var types = getImageTypes();
      for (var i in types) {
        var type = types[i];
        if (type === '') {
          continue;
        }

        // Add input field
        var input = append(p, 'input');
        input.type = 'radio';
        input.id = 'radiogroup-typeselect-' + type;
        input.checked = (type == wizard.imageType) ? 'checked ' : '';
        input.name = 'firmwareType';
        input.addEventListener('click', (function(type) {
          // Button toggle
          type = (wizard.imageType == type ? -1 : type);
          return function() { firmwarewizard.setImageType(type); };
        })(type));

        // Add label element
        var label = append(p, 'label');
        label.setAttribute('for', 'radiogroup-typeselect-' + type);
        label.classList.add(typeNames[type] || '');
        label.textContent = tr(typeNames[type]) || type;
      }
    }
    showImageTypes();

    // Show branch selection
    function showBranches() {
      if (wizard.model == -1 || wizard.revision == -1 || wizard.imageType == -1 || isEmptyObject(images)) {
        return;
      }

      var revisions = images[wizard.vendor][wizard.model]
        .filter(function(e) { return (e.revision == wizard.revision) && (e.type == wizard.imageType); })
        .sort(function(a, b) { return (a.branch > b.branch); });

      var bs = $('#branchselect');
      clearChildren(bs);

      hide('#releases');
      hide('#stable');
      hide('#unstable');
      hide('#testing');

      for (var i in revisions) {
        var rev = revisions[i];
        var content = rev.branch;
        var info = [rev.version, rev.size].filter(isNonEmptyString).join(', ');
        if (info.length) {
          content += ' (' + info + ')';
        }

        // Show release notes
        if (isStable(rev.branch)) {
          $('#stable-label').textContent = rev.branch;
          show('#stable');
          show('#releases');
        } else if (isUnstable(rev.branch)) {
          $('#unstable-label').textContent = rev.branch;
          show('#unstable');
          show('#releases');
        } else if (isTesting(rev.branch)) {
          $('#testing-label').textContent = rev.branch;
          show('#testing');
          show('#releases');
        }

        // Add link element
        var a = append(bs, 'a');
        a.href = rev.location;
        a.classList.add('btn');
        a.textContent = content;
      }
    }
    showBranches();

    function updateHardwareSelection() {
      if (wizard.vendor == -1) {
        hide('#modelselect');
        hide('#revisionselect');
      } else {
        show_inline('#modelselect');
        if (wizard.model == -1) {
          hide('#revisionselect');
        } else {
          show_inline('#revisionselect');
        }
      }
    }
    updateHardwareSelection();

    function updatePanes() {
      var pane = PANE.MODEL;
      if (wizard.vendor != -1 && wizard.model != -1 && wizard.revision != -1) {
        pane = PANE.IMAGETYPE;
        if (wizard.imageType != -1) {
          pane = PANE.BRANCH;
        }
      }

      $('#model-pane').style.display = (pane >= PANE.MODEL) ? 'block' : 'none';
      $('#type-pane').style.display = (pane >= PANE.IMAGETYPE) ? 'block' : 'none';
      $('#branch-pane').style.display = (pane >= PANE.BRANCH) ? 'block' : 'none';
    }
    updatePanes();

    // Show branches in the upper right corner
    function updateCurrentVersions() {
      var branches = Object.values(config.sources).filter(isNotUnique);

      var versions = branches.map(function(branch) {
        var version = app.currentVersions[branch];
        return branch + (version ? (': ' + version) : '');
      }).join(' // ');

      $('#currentVersions').textContent = versions;
    }
    updateCurrentVersions();

    function updateFirmwareTable() {
      var tb = $('#firmwareTableBody');
      clearChildren(tb);

      function initializeRevHTML(rev) {
        upgradeHTML[rev.branch] = '';
        factoryHTML[rev.branch] = '';
      }

      function addToRevHTML(rev) {
        var title = [rev.branch, rev.size, rev.fs, rev.version, rev.revision].filter(isNonEmptyString).join(' | ');
        var label = rev.revision + (rev.size.length ? (', ' + rev.size) : '');

        var html = '[<a href="' + rev.location + '" title="' + title + '">' + label + '</a>] ';
        if (rev.type == 'sysupgrade') {
          upgradeHTML[rev.branch] += html;
          show = true;
        } else if (rev.type == 'factory') {
          factoryHTML[rev.branch] += html;
          show = true;
        }
      }

      var lines = '';
      var vendors = Object.keys(images).sort();
      for (var v in vendors) {
        var vendor = vendors[v];
        var models = Object.keys(images[vendor]).sort();
        for (var m in models) {
          var model = models[m];
          var revisions = sortByRevision(images[vendor][model]);
          var upgradeHTML = {};
          var factoryHTML = {};
          var show = false;

          revisions.forEach(initializeRevHTML);
          revisions.forEach(addToRevHTML);

          if (!show) {
            continue;
          }

          lines += '<tr><td>' + vendor + '</td><td>' + model + '</td><td>';

          for(var branch in factoryHTML) {
            lines += branch + ': ' + (factoryHTML[branch] || '-') + '<br>';
          }

          lines += '</td><td>';

          for(branch in upgradeHTML) {
            lines += branch + ': ' + (upgradeHTML[branch] || '-') + '<br>';
          }

          lines += '</td></tr>';
        }
      }
      tb.innerHTML = lines;
    }
    updateFirmwareTable();
  }

  // Parse the contents of the given sources
  function loadDirectories() {
    var vendormodels_reverse = buildVendorModelsReverse();
    var pathsToLoad = Object.values(config.sources).length;
    var usedMatchers = {}; // For debugging

    // Sort by length to get the longest match
    var matches = Object.keys(vendormodels_reverse).sort(function(a, b) {
      if (a.length < b.length) return 1;
      if (a.length > b.length) return -1;
      return 0;
    });

    // Match all links
    var reLink = new RegExp('href="([^"]*)"', 'g');

    // Match image files
    var reMatch = new RegExp('[-_](' + matches.join('|') + ')[.-]', 'i');

    function loadFinished() {
      pathsToLoad -= 1;

      // Check if all paths has been loaded
      if (pathsToLoad > 0) {
        return;
      }

      // Build HTML content
      updateHTML(wizard);

      // Debug output
      if (config.listUnusedMatchers) {
        for (var match in vendormodels_reverse) {
          if( !(match in usedMatchers)) {
            console.log('No file was matched by ' + match);
          }
        }
      }
    }

    var parseHTML = function(data, indexPath) {
      var basePath = indexPath.substring(0, indexPath.lastIndexOf('/') + 1);
      var branch = config.sources[indexPath];
      reLink.lastIndex = 0;

      var m;
      do {
        m = reLink.exec(data);
        if (m) {
          var href = m[1];
          if (ignoredFileName(href)) {
            continue;
          }
          var match = reMatch.exec(href);
          if (match) {
            var matcher = match[1];
            var devices = vendormodels_reverse[matcher];

            for (var i in devices) {
              parseFilePath(devices[i], matcher, basePath, href, branch);
            }

            if (config.listUnusedMatchers) {
              usedMatchers[matcher] = null;
            }
          } else if (config.listMissingMatchers) {
            console.log("No match for file for:", href);
          }
        }
      } while (m);

      loadFinished();
    };

    var parseJSON = function(data, indexPath) {
      var basePath = indexPath.substring(0, indexPath.lastIndexOf('/') + 1);
      var branch = config.sources[indexPath];
      var obj = JSON.parse(data);

      for (var i in obj) {
        var href = obj[i];

        if (ignoredFileName(href)) {
          continue;
        }

        var match = reMatch.exec(href);
        if (match) {
          var matcher = match[1];
          var devices = vendormodels_reverse[matcher];

          for (var i in devices) {
            parseFilePath(devices[i], matcher, basePath, href, branch);
          }

          if (config.listUnusedMatchers) {
            usedMatchers[matcher] = null;
          }
        } else if (config.listMissingMatchers) {
          console.log("No rule for firmware image:", href);
        }
      }

      loadFinished();
    };

    for (var indexPath in config.sources) {
      if (indexPath.endsWith('json')) {
        // Retrieve JSON file data
        loadFile(indexPath, parseJSON);
      } else {
        // Retrieve HTML file listing
        loadFile(indexPath, parseHTML);
      }
    }
  }

  loadDirectories();

  // Set link to first firmware source
  for (var path in config.sources) {
    $('#firmware-source-dir').href = path.replace(/\/[^\/]*$/, '');
    break;
  }

  function determineLocale() {
    var requestedLocales = window.navigator.languages;
    var supportedLocales = Object.getOwnPropertyNames(translations);
    // find by full match lang and country i.e. pt-BR == pt-BR
    for (var lng in requestedLocales) {
      var requestedLocale = requestedLocales[lng];
      if (supportedLocales.includes(requestedLocale)) {
        config.language = requestedLocale;
        console.log("i18n by lang and country: " + config.language);
        return;
      }
    }

    // find by match lang but ignoring country i.e. pt-BR == pt
    for (var lng in requestedLocales) {
      var language = requestedLocales[lng].split('-')[0];
      if (supportedLocales.includes(language)) {
        config.language = language;
        console.log("i18n by lang: " + config.language);
        return;
      }
    }
    console.log("i18n default: " + config.language);
  }

  determineLocale();

  // Translate all texts
  app.changeLanguage(config.language);

  return app;
}();
