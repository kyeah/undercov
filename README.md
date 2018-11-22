# TODO

- [ ] Options for base paths to CI file based on pageType=pull vs other types (and also based on the repository you're in)
- [] Performance
- [x] Fix race condition with setInterval stuff (or find a better solution)
- [] options for UI (swapping code diff vs blob num highlighting)
- [] fix button toggle or just remove it
- [] fix pageType=tree visualize overall coverage
- [] fix showing ratios for each file
- [] combine app+tools reports (probably lcov + lcov > genhtml + json; should look at how istanbul implements this)
- [] retrieve report by commit (need to export artifacts to a dummy project)

# pcov

Chrome extension to overlay code coverage reports from an arbitrary HTTP source onto Github.

* This extension is inspired by the [codecov browser extension](https://github.com/codecov/browser-extension) and the [coveralls-overlay project](https://github.com/kwonoj/coveralls-overlay).
* Icon resource comes from Google's [material design icon library](https://www.google.com/design/icons/#ic_visibility).
