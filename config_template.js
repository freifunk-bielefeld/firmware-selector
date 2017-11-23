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
  language: 'de-freifunk',
  // Relative image paths and branch
  directories: {
    // The images will be extracted from
    // directory listings of the web server
    './images/gluon-factory-example.html': 'stable',
    './images/gluon-sysupgrade-example.html': 'stable'
  }
};
