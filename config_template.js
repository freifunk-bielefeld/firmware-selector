
var config = {
  // File to model mappings, see devices.js
  vendormodels: vendormodels,

  // Default language, see i18n.js
  language: 'en',

  // Data source and branch
  sources: {
    // Scrape image paths from html files
    './images/gluon-factory-example.html': 'stable',
    './images/gluon-sysupgrade-example.html': 'stable'

    // Or from directory listings
    //'https://downloads.openwrt.org/releases/17.01.5/targets/': 'stable',
    //'https://downloads.openwrt.org/snapshots/targets/': 'snapshot'

    // Or use a JSON API
    'https://downloads.openwrt.org/releases/18.06.2/targets/?json': 'stable',
    'https://downloads.openwrt.org/snapshots/targets/?json': 'snapshot'
  },

  // Debug: List images in browser console that match no model
  listUnusedMatchers: false,

  // Debug: List images in browser console that were not matched
  listMissingMatchers: false,

  // Indicate what branches are stable, unstable or testing.
  // Normally, there is no need to change this.
  stable: ['stable', 'release', 'tested'],
  unstable: ['beta', 'unstable'],
  testing: ['alpha', 'snapshot', 'nightly', 'experimental']
};
