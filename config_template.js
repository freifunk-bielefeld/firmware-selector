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
    //'https://downloads.lede-project.org/releases/17.01.4/targets/?json': 'stable'
  }
};
