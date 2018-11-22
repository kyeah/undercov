# TODO

- Options for base paths to CI file based on pageType=pull vs other types (and also based on the repository you're in)
- Performance
- Fix race condition with setInterval stuff (or find a better solution)
- options for UI (swapping code diff vs blob num highlighting)
- fix button toggle or just remove it
- fix pageType=tree visualize overall coverage
- fix showing ratios for each file
- combine app+tools reports (probably lcov + lcov > genhtml + json; should look at how istanbul implements this)

# coveralls-overlay (DEPREACATED)
**I'm not using coveralls in general for my work project, not able to spend time to update plugin with new github UI changes.**

Chrome extension to overlay [coveralls](http://coveralls.io/) code coverage into github public repository covered by coveralls using [public api](https://coveralls.zendesk.com/hc/en-us/articles/201774865-API-Introduction)

* This extension is inspired by [codecov browser extension](https://github.com/codecov/browser-extension) and reused some of existing components.
* Icon resource comes from google's [material design icon](https://www.google.com/design/icons/#ic_visibility).
