# undercov

Chrome extension to overlay code coverage reports from an arbitrary HTTP source onto Github projects.

* This extension is inspired by the [codecov browser extension](https://github.com/codecov/browser-extension) and the [coveralls-overlay project](https://github.com/kwonoj/coveralls-overlay).
* Icon resource comes from Google's [material design icon library](https://www.google.com/design/icons/#ic_visibility).

# TODO

- [ ] Better UI for multiple repos
- [ ] Options and converters for different formats (lcov, cobertura, coveralls, code-cov, etc.)
- [ ] options for UI (swapping code diff vs blob num highlighting)
- [ ] fix pageType=tree visualize overall coverage
- [ ] fix showing ratios for each file
- [ ] clickthrough button to html src, if available (helps to see more detail on partial hits)
- [ ] LRU chrome storage
- [ ] Support reading repo options from undercov file stored in repo?
