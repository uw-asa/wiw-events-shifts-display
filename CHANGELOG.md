# Changelog

## [unreleased]

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
