# Changelog

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
