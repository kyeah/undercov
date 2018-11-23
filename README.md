# undercov

Chrome extension to overlay code coverage reports from an arbitrary HTTP source onto Github projects.

* This extension is inspired by the [codecov browser extension](https://github.com/codecov/browser-extension) and the [coveralls-overlay project](https://github.com/kwonoj/coveralls-overlay).
* Icon resource comes from Google's [material design icon library](https://www.google.com/design/icons/#ic_visibility).

# TODO

- [ ] Options to support multiple repos
- [ ] Options and converters for different formats (json, lcov, etc.)
- [ ] options for UI (swapping code diff vs blob num highlighting)
- [ ] fix pageType=tree visualize overall coverage
- [ ] fix showing ratios for each file
- [ ] combine app+tools reports (probably lcov + lcov > genhtml + json; should look at how istanbul implements this)
- [ ] retrieve report by commit (need to export artifacts to a dummy project)
