## OpenWrt/LEDE Firmware Wizard
---

This Firmware Wizard lets a user select the correct firmware for his device. Directory listings are used to parse the list of available images.

Some [Screenshots](docs/screenshots.md).

Features:

- can scrape HTML file listings or read a JSON API (array of image path strings)
- English and German translations available
- supports stable, beta and experimental image selection

Similar projects:

- [Gluon Firmware Wizard](https://github.com/freifunk-darmstadt/gluon-firmware-wizard): Original source of this project, but now with images.
- [Freifunk Hennef Firmware Downloader](https://github.com/Freifunk-Hennef/ffhef-fw-dl): Similar to the one above, but has a different code base.
- [LibreMesh Chef](https://chef.libremesh.org/): Can select configurations.

### Start

1. Download this repository
2. Copy `config_template.js` to `config.js`
3. Start a webserver in the project folder

#### Apache Webserver
Create a `.htaccess` file that enables directory listings:
```
Options +Indexes
```

#### Nginx Webserver
For `nginx`, auto-indexing has to be turned on:
```
location /path/to/builds/ {
    autoindex on;
}
```

#### Python Webserver
For testing purposes or to share files in a LAN, Python can be used. Run `python3 -m http.server 8080` from within this directory (the directory where `README.md` can be found) and you are done.

### Model Database
All available router models are specified in `devices.js` via that will match against the filenames.
If no hardware revision is given or is it is empty, the revision is extracted from the file name.

```
{
  <vendor>: {
    <model>: <match>,
    <model>: {<match>: <revision>, ...}
    ...
  }, ...
}
```

If two matches overlap, the longest match will be assigned the matching files. On the other hand, the same match can be used by multiple models without problems.

### TODO
- support rootfs/kernel image combinations
- cleanup code
- clean translations
