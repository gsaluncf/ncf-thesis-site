# Upstream dashboard

The static dashboard in this repository is derived from Manu López Zafra's NCF
Senior Thesis Dashboard:

- Repository: https://github.com/mlopezzafra-ncf/ncf-senior-thesis-dashboard
- Imported commit: `36f923350916a30b7abce91cbe32395e9d3e601f`

Run `npm run import:upstream` to replace the imported snapshot with the pinned
commit and regenerate `upstream-manifest.json`. Product enhancements are applied
during `npm run build`, so reimporting does not overwrite the enhancement source.
