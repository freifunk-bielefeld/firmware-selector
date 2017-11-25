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
  return 'stable release tested'.indexOf(branch.toLowerCase()) !== -1;
}

function isBeta(branch) {
  return 'beta unstable'.indexOf(branch.toLowerCase()) !== -1;
}

function isSnapshot(branch) {
  return 'alpha snapshot nightly experimental'.indexOf(branch.toLowerCase()) !== -1;
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
          addArray(vendormodels_reverse, match, {'vendor': vendor, 'model': model, 'revision': ''});
        } else for (var m in match) {
          addArray(vendormodels_reverse, m, {'vendor': vendor, 'model': model, 'revision': match[m]});
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
  }

  // Exclude file names containing specific strings
  function ignoredFileName(name) {
    for (var i in IGNORED_ELEMENTS) {
      if (name.indexOf(IGNORED_ELEMENTS[i]) != -1) {
        return true;
      }
    }
    return false;
  }

  // Simplified version string sort
  function sortByRevision(revisions) {
    revisions.sort(function(a, b) {
        a = a.revision; b = b.revision;
        if (a.length > b.length) return 1;
        if (a.length < b.length) return -1;
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      });
    return revisions;
  }

  function findImageType(name) {
    var m = /-(sysupgrade|factory|rootfs|kernel)[-.]/.exec(name);
    return m ? m[1] : 'factory';
  }

  function findVersion(name) {
    // Version with optional date in it (e.g. 0.8.0~20160502)
    var m = /-([0-9]+.[0-9]+.[0-9]+(~[0-9]+)?)[.-]/.exec(name);
    return m ? m[1] : '';
  }

  function findRevision(name) {
    // Reversion identifier like a1, v2
    var m = /-([a-z][0-9]+(.[0-9]+)?)[.-]/.exec(name);
    return m ? m[1] : tr('tr-all');
  }

  function findRegion(name) {
    var m = /-(cn|de|en|eu|il|jp|us)[.-]/.exec(name);
    return m ? m[1] : '';
  }

  function findSize(name) {
    var m = /-(4M|8M|16M|32M|64M)[.-]/.exec(name);
    return m ? m[1] : '';
  }

  function findFileSystem(name) {
    var m = /-(ext2|ext3|ext3|squashfs|fat32)[-.]/.exec(name);
    return m ? m[1] : '';
  }

  function addArray(obj, key, value) {
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

    addArray(images[device.vendor], device.model, {
      'revision': revision,
      'branch': branch,
      'type': type,
      'version': version,
      'location': location,
      'size': size,
      'fs': fs
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
      .filter(function(value, index, self) { return self.indexOf(value) === index; });
  }

  function getImageTypes() {
    return images[wizard.vendor][wizard.model]
      .map(function(e) { return e.type; })
      .filter(function(value, index, self) { return self.indexOf(value) === index; })
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

      var types = getImageTypes();
      var typeNames = {
        'factory': 'tr-factory',
        'sysupgrade': 'tr-sysupgrade',
        'rootfs': 'tr-rootfs',
        'kernel': 'tr-kernel'
      };

      var p = $('#typeselect');
      clearChildren(p);

      for (var i in types) {
        var type = types[i];
        if (type === '') continue;

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
        .filter(function(e) { return e.revision == wizard.revision && e.type == wizard.imageType; });

      var bs = $('#branchselect');
      var bd = $('#branch-snapshot-dl');

      clearChildren(bs);
      clearChildren(bd);

      hide('#snapshot-warning');
      hide('#releases');
      hide('#stable');
      hide('#beta');
      hide('#snapshot');

      for (var i in revisions) {
        var rev = revisions[i];
        var content = rev.branch + (rev.version ? (' (' + rev.version + ')') : '');

        // Show release notes
        if (isStable(rev.branch)) {
          $('#stable-label').textContent = rev.branch;
          show('#stable');
          show('#releases');
        } else if (isBeta(rev.branch)) {
          $('#beta-label').textContent = rev.branch;
          show('#beta');
          show('#releases');
        } else if (isSnapshot(rev.branch)) {
          $('#snapshot-label').textContent = rev.branch;
          show('#snapshot');
          show('#releases');
        }

        if (isSnapshot(rev.branch)) {
          // Add button element
          var button = append(bs, 'button');
          button.classList.add('btn', 'dl-snapshot');
          button.addEventListener('click', function() {
            var e = $('#snapshot-warning');
            e.style.display = (e.style.display == 'none') ? 'block' : 'none';
          });
          button.textContent = content;

          // Add link element
          var a = append(bd, 'a');
          a.href = rev.location;
          a.classList.add('btn', 'tr-download-snapshot');
          a.textContent = tr('tr-download-snapshot');
        } else {
          // Add link element
          var a = append(bs, 'a');
          a.href = rev.location;
          a.classList.add('btn');
          a.textContent = content;
        }
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

    // Show branches
    function updateCurrentVersions() {
      var branches = Object.values(config.directories)
        .filter(function(value, index, self) { return self.indexOf(value) === index; });

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

      var initializeRevHTML = function(rev) {
        upgradeHTML[rev.branch] = '';
        factoryHTML[rev.branch] = '';
      };

      var addToRevHTML = function(rev) {
        var html = '[<a href="' + rev.location + '" title="' + rev.version + '">' + rev.revision + '</a>] ';
        if (rev.type == 'sysupgrade') {
          upgradeHTML[rev.branch] += html;
          show = true;
        } else if (rev.type == 'factory') {
          factoryHTML[rev.branch] += html;
          show = true;
        }
      };

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

  function loadSite(url, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        callback(xmlhttp.responseText, url);
      }
    };
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
  }

  // Parse the contents of the given directories
  function loadDirectories() {
    var vendormodels_reverse = buildVendorModelsReverse();

    // Sort by length to get the longest match
    var matches = Object.keys(vendormodels_reverse).sort(function(a, b) {
      if (a.length < b.length) return 1;
      if (a.length > b.length) return -1;
      return 0;
    });

    // Match all links
    var reLink = new RegExp('href="([^"]*)"', 'g');

    // Match image files
    var reMatch = new RegExp('(' + matches.join('|') + ')[.-]');

    var parseHTML = function(data, indexPath) {
      var basePath = indexPath.substring(0, indexPath.lastIndexOf('/') + 1);
      var branch = config.directories[indexPath];
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
            var devices = vendormodels_reverse[match[1]];
            for (var i in devices) {
              parseFilePath(devices[i], match[1], basePath, href, branch);
            }
          } else if (config.listMissingImages) {
            console.log("No rule for firmware image:", href);
          }
        }
      } while (m);

      updateHTML(wizard);
    }

    var parseJSON = function(data, indexPath) {
      var basePath = indexPath.substring(0, indexPath.lastIndexOf('/') + 1);
      var branch = config.directories[indexPath];
      var obj = JSON.parse(data);

      for (var i in obj) {
        var href = obj[i];

        if (ignoredFileName(href)) {
          continue;
        }

        var match = reMatch.exec(href);
        if (match) {
          var devices = vendormodels_reverse[match[1]];
          for (var i in devices) {
            parseFilePath(devices[i], match[1], basePath, href, branch);
          }
        } else if (config.listMissingImages) {
          console.log("No rule for firmware image:", href);
        }
      }

      updateHTML(wizard);
    }

    for (var indexPath in config.directories) {
      if (indexPath.endsWith('json')) {
        // Retrieve JSON file data
        loadSite(indexPath, parseJSON);
      } else {
        // Retrieve HTML file listing
        loadSite(indexPath, parseHTML);
      }
    }
  }

  loadDirectories();

  // Set link to first firmware source directory
  for(var path in config.directories) {
    $('#firmware-source-dir').href = path.replace(/\/[^\/]*$/, '');
    break;
  }

  // Translate all texts
  app.changeLanguage(config.language);

  return app;
}();
