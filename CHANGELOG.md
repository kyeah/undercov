v1.0.2
-------

## Changed

- Each code coverage origin must now be explicitly allowed by the extension user.

## Updated

- Bumped `less` package version from 3.8.1 to 3.9.0.
- Bumped `typescript` package version from 3.1.6 to 3.2.2.

## Fixed

- Allow .undercov.json to be found when visiting the main repo page.

v1.0.1
-------

## Changed

- Limited content script permissions to https://github.com/ and https://raw.githubusercontent.com/
- Opened generalized permissions to require all URLs.
  - This is needed to support outbound requests to coverage storage URLs.
