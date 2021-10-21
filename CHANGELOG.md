# Changelog

## [3.0.1-dev] - Dev-only; minor patches to dependencies

- Dependency Updates
  - mocha 9.1.2 -> 9.1.3
  - eslint-plugin-import 2.24.2 -> 2.25.2
  - eslint 7.32.0 -> 8.0.1
  - axios 0.22.0 -> 0.23.0

## [3.0.0-dev] - Dev-Only; Electron update and major re-structuring

Many changes necessitated as part of updating Electron from v6 to v12 (oldest still-supported version [to limit the number of possible breaking changes, of which there are many]). Notably there's been a major restructuring of the three main Electron processes and their roles. Previously the code was all in renderer, which had access to all the Node APIs. With the update (because of security and best practices) most of that code needed to be removed to Main or Preload in order to be able to access those APIs, as well as the utility functions in `/utils`. The rewrite also necessitated using IPC (inter-process communication) to handle function transitions and passing back and forth functions. Libraries such as Pug for templating and moment/date-fns can't be required into the browser environment, so any functions provided by those libraries or by functions I've written need to be explicitly passed in via Electron's ContextBridge in `preload.js`.

### Architecture changes

API fetching and data processing moved to main process. DOM functionality provided by the browser environment no longer available to the data processing utility functions (used to parse XML), so a new dependency (@xmldom/xmldom) has been added to cover for the missing DOMParser functionality. This replacement is mostly drop-in and package size hasn't significantly increased.

### Core Dependency Updates

- axios 0.19.2 👉 0.22.0
- dotenv 8.2.0 👉 10.0.0
- pug 3.0.0 👉 3.0.2
- electron 6.1.7 👉 12.2.1

### Moment.js deprecated

Began removal of moment.js in favor of using format from date-fns, which is a lighter-weight Moment replacement. This necessitated refactoring the format string templates and using different functions compared to what was available in Moment.js. There are still many places that Moment is referenced though.

### Minor Changes

- Added minor change to css to re-enable window dragging (was enabled by default in electron v6, but not in 12, apparently). Footer designated as a draggable area. This is really only relevant for desktop use/development testing.
- `.dockerignore`: Added more files to be excluded; Fixed rules that weren't working.
- Patched errorBackOff() so that it incrases error backoff rate at expected intervals, rather than immediately jumping to the MAX_REFRESH_INTERVAL.

## [2.1.3-dev] - Dev-only

Updated README due to changes in Balena ("Applications" 👉 "Fleets")

### [Issue #20](https://github.com/uw-asa/wiw-events-shifts-display/issues/20) - Multi-Architecture Builds

- `.dockerignore` updated to exclude more items.
- Altered the dockerfile to a template for builds that take the Balena Fleet architecture into account and builds based on whatever architecture is needed for that target device arch.
- 2 architectures tested in build process: armv7hf (pi2, pi3) and aarch64 (pi3-64, pi4-64).
- Base OS for deployment is sticking to Ubuntu 18.04 LTS (Bionic), as it has the most support at this time.

## [2.1.2-dev] - Dev-only

### [Issue #22](https://github.com/uw-asa/wiw-events-shifts-display/issues/22) - Dependency Updates

- Updated dev dependencies
  - chai 4.2.0 👉 4.3.4
  - eslint 6.8.0 👉 7.3.2
  - eslint-plugin-import 2.20.1 👉 2.24.2
  - eslint-plugin-airbnb-base 14.1.0 👉 14.2.1
  - eslint-plugin-mocha 6.3.0 👉 9.0.0
  - mocha 7.1.1 👉 9.1.2
  - nyc 15.0.0 👉 15.1.0
- Updated static distributable libraries
  - bootstrap 4.3.1 👉 5.1.2
  - jquery 3.4.1 👉 3.6.0
- 🔧 Patched issue with text alignment class changes due to update to bootstrap css changes
- Updated production dependencies
  - moment 2.24.0 👉 2.27.0
  - pug 2.0.4 👉 3.0.0

## [2.1.1] - 2021/10/07 - Added changelog [Issue #21](https://github.com/uw-asa/wiw-events-shifts-display/issues/21) 

Added changelog to track changes. Current version is v2.1.1
