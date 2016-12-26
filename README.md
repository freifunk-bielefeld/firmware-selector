OpenWrt/LEDE Firmware Wizard
---

This Firmware Wizard enables an user to easily select the correct firmware for his WIFI device. Directory listings are used to parse the list of available fw images.

Some [Screenshots](docs/screenshots.md).

### Configuration

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
For testing purposes or to share files in a LAN, Python can be used. Run `python -m http.server 8080` from within this directory (the directory where `README.md` can be found) and you are done.

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

### Configuration
Image paths and available branches can be set in file `config_template.js` which has to be renamed to `config.js`

### TODO
- support rootfs/kernel image combinations

### License
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
