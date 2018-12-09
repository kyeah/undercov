v1.0.2

## Fixed

- Allow .undercov.json to be found when visiting the base repo URL.

v1.0.1
-------

## Changed

- Limited content script permissions to https://github.com/ and https://raw.githubusercontent.com/
- Opened generalized permissions to require all URLs.
  - This is needed to support outbound requests to coverage storage URLs.
