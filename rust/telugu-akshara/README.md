# Telugu Akshara WebAssembly

This crate segments Telugu text into orthographic akshara units. The Aksharamala page loads the compiled WebAssembly lazily when a Telugu search is entered.

Requirements: Rust with the `wasm32-unknown-unknown` target.

Rebuild the static module from the repository root:

```sh
node scripts/build-rust-wasm.mjs
```

The generated `public/wasm/telugu_akshara.wasm` is served as a static asset, so Vercel builds do not need a Rust toolchain when that artifact is already present.