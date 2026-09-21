---
"eslint-config-godaddy-react": patch
---

Replace `FlatCompat` workaround with `eslint-plugin-react-hooks` native flat config support (`configs['recommended-latest']`), fixing an import error when used with ESLint 10.
