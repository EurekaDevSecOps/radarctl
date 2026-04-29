# Changelog

## [2.2.1](https://github.com/EurekaDevSecOps/radarctl/compare/v2.2.0...v2.2.1) (2026-04-29)


### Miscellaneous Chores

* Remove EUREKA_PROFILE usage ([#89](https://github.com/EurekaDevSecOps/radarctl/issues/89)) ([e504244](https://github.com/EurekaDevSecOps/radarctl/commit/e504244405d8867ffc50ca5d90bf26ee8e75677b))

## [2.2.0](https://github.com/EurekaDevSecOps/radarctl/compare/v2.1.0...v2.2.0) (2026-04-24)


### Improvements

* Add autopackager to veracode-sast ([#87](https://github.com/EurekaDevSecOps/radarctl/issues/87)) ([dec6fc3](https://github.com/EurekaDevSecOps/radarctl/commit/dec6fc3c7ff526748f686a7c77e64645f087b4de))


### Fixes

* Autopackager for Veracode SAST ([#90](https://github.com/EurekaDevSecOps/radarctl/issues/90)) ([5ed27fd](https://github.com/EurekaDevSecOps/radarctl/commit/5ed27fd09ab76ba46e00c67e96b43d8d59caa162))

## [2.1.0](https://github.com/EurekaDevSecOps/radarctl/compare/v2.0.2...v2.1.0) (2026-04-20)


### Improvements

* **PE-956:** Tag lines of code where a vulnerability should be ignored ([#77](https://github.com/EurekaDevSecOps/radarctl/issues/77)) ([a06bda1](https://github.com/EurekaDevSecOps/radarctl/commit/a06bda13441f9635bca0539b53fc198373c55aee))


### Miscellaneous Chores

* Echo scanner stdout log when debug flag is on ([#83](https://github.com/EurekaDevSecOps/radarctl/issues/83)) ([da9d014](https://github.com/EurekaDevSecOps/radarctl/commit/da9d0149bdff17fc47788800c73b03ef20345c47))

## [2.0.2](https://github.com/EurekaDevSecOps/radarctl/compare/v2.0.1...v2.0.2) (2026-04-13)


### Fixes

* (PE-786) - Ensure the Radar can run in a BitBucket CI/CD pipeline ([#73](https://github.com/EurekaDevSecOps/radarctl/issues/73)) ([be0ad7a](https://github.com/EurekaDevSecOps/radarctl/commit/be0ad7a42cc3aaa4a4f97cde0aaf6607b2d8a2fc))

## [2.0.1](https://github.com/EurekaDevSecOps/radarctl/compare/v2.0.0...v2.0.1) (2026-04-07)


### Fixes

* **PE-1003:** Add handling for git ssh azure domains ([#76](https://github.com/EurekaDevSecOps/radarctl/issues/76)) ([a990711](https://github.com/EurekaDevSecOps/radarctl/commit/a99071107c0f871f4c05e8f4d91c5a0fe4182f58))


### Code Refactoring

* **PE-977:** Ensure the Azure Devops url is decoded during parsing ([#71](https://github.com/EurekaDevSecOps/radarctl/issues/71)) ([a825ce0](https://github.com/EurekaDevSecOps/radarctl/commit/a825ce0710a51ec171555247d8d0315b2897a73b))

## [2.0.0](https://github.com/EurekaDevSecOps/radarctl/compare/v1.11.0...v2.0.0) (2026-03-04)


### ⚠ BREAKING CHANGES

* **scan:** Exit codes have changed. When vulnerabilities are found, instead of returning exit codes in the range 8-15, Radar CLI now only returns 8.

### Improvements

* **scan:** Add THRESHOLD option ([#67](https://github.com/EurekaDevSecOps/radarctl/issues/67)) ([47a0b7b](https://github.com/EurekaDevSecOps/radarctl/commit/47a0b7bdc2b9f59d13cc6d35d6b1367b00b4ebc3))
* **scans:** Display link to scan in Eureka dashboard ([#68](https://github.com/EurekaDevSecOps/radarctl/issues/68)) ([0b33b79](https://github.com/EurekaDevSecOps/radarctl/commit/0b33b79420a6589b33b1dc4370e4733bf872eaae))

## [1.11.0](https://github.com/EurekaDevSecOps/radarctl/compare/v1.10.0...v1.11.0) (2026-02-27)


### Improvements

* Add support for Veracode Pipeline (SAST) scanner ([#2](https://github.com/EurekaDevSecOps/radarctl/issues/2)) ([bf7f04b](https://github.com/EurekaDevSecOps/radarctl/commit/bf7f04b4fd8bfc5fd3e13b25365809209db80cec))

## [1.10.0](https://github.com/EurekaDevSecOps/radarctl/compare/v1.9.8...v1.10.0) (2026-02-25)


### Improvements

* **PE-961:** Job path from Managed Scan runner being included in vulnerability results ([#63](https://github.com/EurekaDevSecOps/radarctl/issues/63)) ([f014598](https://github.com/EurekaDevSecOps/radarctl/commit/f0145985152b4d5cb5af7d10de7981777ce40ce4))

## [1.9.8](https://github.com/EurekaDevSecOps/radarctl/compare/v1.9.7...v1.9.8) (2026-02-19)


### Fixes

* **scans:** Add handling for ADO git URLs ([#61](https://github.com/EurekaDevSecOps/radarctl/issues/61)) ([cad3c13](https://github.com/EurekaDevSecOps/radarctl/commit/cad3c13ad90d2866b7ad019d145882e0955a8243))
* **scans:** Update scan command to accept optional scan ID from args ([#60](https://github.com/EurekaDevSecOps/radarctl/issues/60)) ([3f7b2f9](https://github.com/EurekaDevSecOps/radarctl/commit/3f7b2f9881a201116f54752ce27bd5e36d652f23))


### Code Refactoring

* **telemetry:** Add a reportScanFailure wrapper for telemetry send/receive ([#57](https://github.com/EurekaDevSecOps/radarctl/issues/57)) ([9b2b8aa](https://github.com/EurekaDevSecOps/radarctl/commit/9b2b8aad4a59e9312bb5713a4aaf5b154f6e390b))


### CI/CD

* **commitlint:** Fix commitlint GHA errors ([#58](https://github.com/EurekaDevSecOps/radarctl/issues/58)) ([b27d64e](https://github.com/EurekaDevSecOps/radarctl/commit/b27d64e5ddab6fad389aa1489173c3a992633ff6))

## [1.9.7](https://github.com/EurekaDevSecOps/radarctl/compare/v1.9.6...v1.9.7) (2026-01-29)


### CI/CD

* Upgrade to scan-action@v2 ([#55](https://github.com/EurekaDevSecOps/radarctl/issues/55)) ([48a26a3](https://github.com/EurekaDevSecOps/radarctl/commit/48a26a3f8a5874cb9d2ea976a695ee53a8eb5940))

## [1.9.6](https://github.com/EurekaDevSecOps/radarctl/compare/v1.9.5...v1.9.6) (2026-01-23)


### Code Refactoring

* Add changes to send repoFullName in ewa & vdbe api requests ([ebf9ad1](https://github.com/EurekaDevSecOps/radarctl/commit/ebf9ad135a130711fe2342cc98e8d92dd1e1eea8))
* Add profile id to support current agent tokens for backwards compatability ([50f4ef3](https://github.com/EurekaDevSecOps/radarctl/commit/50f4ef371db9bb73c500da8d53ea8333ddb916ec))
* Add profileId param to scan summary endpoint. ([84ec215](https://github.com/EurekaDevSecOps/radarctl/commit/84ec2153f418589644083127b4b201db8824a6d2))
* Add scanStartTimeStamp and pass as parameter to both scans/started endpoints to ensure timestamps are consistent between vdbe & ewa ([4762af1](https://github.com/EurekaDevSecOps/radarctl/commit/4762af1e32682fee6ef33fe2ae39566f79e3ac4c))
* Change vdbe metadata (stage 2) endpoint to scan started ([3409d78](https://github.com/EurekaDevSecOps/radarctl/commit/3409d783dd4577155db369e2c23312254a705c90))
* Remove EUREKA_PROFILE env var ([8239410](https://github.com/EurekaDevSecOps/radarctl/commit/8239410db8bf5dcbca5b71d25719f828f52e03f7))
* Remove repoFullName from metadata stage 2 (vdbe) ([7cba841](https://github.com/EurekaDevSecOps/radarctl/commit/7cba841990b9796d8eacb74b562dfb52366a6661))
* Remove repoFullName from scan started endpoint ([1bfe3fb](https://github.com/EurekaDevSecOps/radarctl/commit/1bfe3fb612be0f0ba4f4e9c82dbba56e254f7dc6))
* Remove repoFullName from summary & complete endpoint ([6fd01d4](https://github.com/EurekaDevSecOps/radarctl/commit/6fd01d4e98545833f6c4b6f5b41909db6d5d0a62))
* **scan:** Changes to support repository based permissions for scans ([c2f0d15](https://github.com/EurekaDevSecOps/radarctl/commit/c2f0d1515d8c7245948e3579d2500fd6ab8836ac))
* Update radar.yaml formatting ([#46](https://github.com/EurekaDevSecOps/radarctl/issues/46)) ([60456fe](https://github.com/EurekaDevSecOps/radarctl/commit/60456fe477adade3272e71e473e4298a196b457f))
* Use Radar CLI scan-action ([#45](https://github.com/EurekaDevSecOps/radarctl/issues/45)) ([f0e6c4c](https://github.com/EurekaDevSecOps/radarctl/commit/f0e6c4c25e8b2e47101b71faba3978cbac1b16d5))
* **vulns:** Remove profile ID from scans. ([869d7be](https://github.com/EurekaDevSecOps/radarctl/commit/869d7be9b08b0b6a01e73f7abb4ffcb4840365a7))


### CI/CD

* Add CHANGELOG.md automation ([#50](https://github.com/EurekaDevSecOps/radarctl/issues/50)) ([6e951c1](https://github.com/EurekaDevSecOps/radarctl/commit/6e951c1fe019db3ab21b0e20aa9658519e81ea2c))
* Use the v1 release of scan-action ([#47](https://github.com/EurekaDevSecOps/radarctl/issues/47)) ([3a9affd](https://github.com/EurekaDevSecOps/radarctl/commit/3a9affd6fe5b4103be4ad3bcb13bd49df7653867))


### Miscellaneous Chores

* Add missing DateTime import ([3fda08d](https://github.com/EurekaDevSecOps/radarctl/commit/3fda08d999986a24ec05bc2a6b574574927981ec))
* Clean up parameter format ([f8c03c6](https://github.com/EurekaDevSecOps/radarctl/commit/f8c03c65b062a5729e5f274393e4a51584ecd9f2))
* Fix profile param format ([10b75d9](https://github.com/EurekaDevSecOps/radarctl/commit/10b75d9a026e09a9eedf3681e5439442de3857df))
* Fix profile param name ([3d5eaf6](https://github.com/EurekaDevSecOps/radarctl/commit/3d5eaf691d672cefc65792963365ff2e87b0a2ce))
* Re-add profile param conditional as vdbe validation was failing due to non-uuid profile value ([e1c007e](https://github.com/EurekaDevSecOps/radarctl/commit/e1c007ef59c5ba2d3368fe162b47ff0cee03493b))
* Remove additional blank line ([940743d](https://github.com/EurekaDevSecOps/radarctl/commit/940743d7510af3ffcc905a29ca565a7d1c5414d1))
* Remove blank line ([c723e7a](https://github.com/EurekaDevSecOps/radarctl/commit/c723e7a20927a29adcf2946dde0cd0a6cdae9d33))
* Remove redundant metadata field and use spread operator for body as it already has the metadata field ([2ffa1f6](https://github.com/EurekaDevSecOps/radarctl/commit/2ffa1f6c6e79710aa97f7f8a192d995b40391dfc))
* Simplify timestamp ([7cab5eb](https://github.com/EurekaDevSecOps/radarctl/commit/7cab5eb47e923a070586d8d8e269bf44d5eaf7a5))
