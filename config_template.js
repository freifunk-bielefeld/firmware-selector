
var config = {
  // List images in browser console that match no model
  listMissingImages: false,
  // See devices.js for different vendor model maps
  vendormodels: vendormodels,
  // Default language, see i18n.js
  language: 'en',
  // Data source and branch
  directories: {
    // Scrape image paths from html files
    './images/gluon-factory-example.html': 'stable',
    './images/gluon-sysupgrade-example.html': 'stable'

    // Or from directory listings
    //'https://downloads.lede-project.org/releases/17.01.4/targets/ar71xx/generic/': 'stable'

    // Or use a JSON API
    //'https://downloads.lede-project.org/releases/17.01.4/targets/?json': 'stable',
    //'https://downloads.lede-project.org/snapshots/targets/?json': 'snapshot'
  }
  // Indicate what branches are stable, unstable or testing.
  stable: ['stable', 'release', 'tested'],
  unstable: ['beta', 'unstable'],
  testing: ['alpha', 'snapshot', 'nightly', 'experimental']
};
