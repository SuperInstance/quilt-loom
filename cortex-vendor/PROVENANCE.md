# Vendored cortex — provenance

- typesafe.mjs / moth.mjs / glm.mjs / receipts.mjs: copied from SuperInstance/quilt-cortex (cortex/)
- arena_moth.mjs: the moth-quantum vault client, copied from SuperInstance/quilt-arena (arena/moth.mjs)
- moth.mjs was repointed at ./arena_moth.mjs so the loom is self-contained.
- Keys are read from the environment (TYPESAFE_API_KEY / MOTH_API_KEY) — never hardcoded.
