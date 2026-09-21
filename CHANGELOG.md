# Changelog

## [3.0.0](https://github.com/alrayyes/pipeline-analytics-sdk-node/compare/v2.1.1...v3.0.0) (2026-09-21)


### ⚠ BREAKING CHANGES

* **spec:** pipeline-analytics' spec removed or narrowed something a client may depend on:

### Features

* **spec:** regenerate types from pipeline-analytics openapi.yaml ([3fc3c5a](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/3fc3c5af7c7f6b5ffb5d7fcef0b1ce42d691741b))

## [2.1.1](https://github.com/alrayyes/pipeline-analytics-sdk-node/compare/v2.1.0...v2.1.1) (2026-09-19)


### Bug Fixes

* **publish:** default the scoped package to public access ([#26](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/26)) ([5515ae2](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/5515ae296770d898f88bf9640a705acb8db6eef3))

## [2.1.0](https://github.com/alrayyes/pipeline-analytics-sdk-node/compare/v2.0.1...v2.1.0) (2026-09-19)


### Features

* generate and publish API reference docs with TypeDoc ([187cf35](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/187cf3554e571bdeb16fc90fa7847abe5a7f10d9))
* generate and publish API reference docs with TypeDoc ([f1617e6](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/f1617e68d5fa12aa72a2de34dc80ba950a9cde17)), closes [#27](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/27)

## [2.0.1](https://github.com/alrayyes/pipeline-analytics-sdk-node/compare/v2.0.0...v2.0.1) (2026-09-19)


### Bug Fixes

* **ci:** add a 7-day cooldown to both Dependabot ecosystems ([#24](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/24)) ([c7fb73c](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/c7fb73ca17fa1812b9bec1e9afa1dbdbe9b6067b))

## [2.0.0](https://github.com/alrayyes/pipeline-analytics-sdk-node/compare/v1.1.0...v2.0.0) (2026-09-19)


### ⚠ BREAKING CHANGES

* the package name is now @pipeline-analytics/sdk-node. Update install commands and imports from pipeline-analytics-sdk-node.

### Features

* **test:** wire up Stryker mutation testing at 100% threshold ([#17](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/17)) ([82e173c](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/82e173cfc551237aa5633dc59357284267653cde))


### Miscellaneous Chores

* move npm package into the pipeline-analytics org ([59e2232](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/59e2232a50021c077c70deb74a374dd2c21e69e6)), closes [#20](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/20)

## [1.1.0](https://github.com/alrayyes/pipeline-analytics-sdk-node/compare/v1.0.1...v1.1.0) (2026-09-18)


### Features

* **release:** publish to GitHub Packages alongside npm ([1fcfdb4](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/1fcfdb465378fe9cd9c7cdb492472e475bda5646))
* **release:** publish to GitHub Packages alongside npm ([bf44440](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/bf44440f76243870d3eb030c906fe9f7497fe0e6)), closes [#15](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/15)

## [1.0.1](https://github.com/alrayyes/pipeline-analytics-sdk-node/compare/v1.0.0...v1.0.1) (2026-09-18)


### Bug Fixes

* bump typescript from 5.9.3 to 6.0.3 in the npm-major group ([#9](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/9)) ([e8d775b](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/e8d775b5b04ba8d5be9e52aac3d6d4e685423c16))

## 1.0.0 (2026-09-17)


### Features

* bootstrap pipeline-analytics-sdk-node client ([6e26673](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/6e2667372672999a80972d46721ac43c396652cd))


### Bug Fixes

* bump @types/bun from 1.3.14 to 1.4.2 in the npm-minor-patch group ([#2](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/2)) ([d544d6c](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/d544d6caa668691250d2c5bc387531293beefaa6))
* **ci:** move Codecov upload out of the required test job ([#6](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/6)) ([44753b9](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/44753b9f0c3165d15d490701d8a97f6bdaed3bce))
* **deps:** resync bun.lock with the @types/bun bump dependabot merged ([#5](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/5)) ([1dd9c91](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/1dd9c91d53fd32fb532c52c2ad8275633e8f58c8))
* **lint:** exclude .release-please-manifest.json from Biome formatting ([#7](https://github.com/alrayyes/pipeline-analytics-sdk-node/issues/7)) ([c6315a1](https://github.com/alrayyes/pipeline-analytics-sdk-node/commit/c6315a164a7926622e68a2a24ab8ee185f22a826))
