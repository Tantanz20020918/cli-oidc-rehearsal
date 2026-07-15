# npm Trusted Publishing Rehearsal

Disposable public package used to verify npm Trusted Publishing with GitHub Actions.

It contains no production code, credentials, or internal references.

## Rehearsed release flow

1. A protected `v*` tag triggers the release workflow.
2. The tag, `package.json`, and `package-lock.json` versions must match, and the tagged commit must be on `main`.
3. CI packs one tarball and generates `checksums.txt`.
4. The `npm-publish` GitHub Environment requires approval.
5. OIDC publishes the tarball on npm under the `rehearsal` dist-tag.
6. The same tarball and checksum are attached to a draft GitHub Release.
