interface TeluguWasmExports {
  memory: WebAssembly.Memory;
  input_ptr: () => number;
  output_ptr: () => number;
  analyze: (inputLength: number) => number;
}

const MAX_INPUT_BYTES = 8192;
let wasmPromise: Promise<TeluguWasmExports> | undefined;

function loadWasm(): Promise<TeluguWasmExports> {
  if (!wasmPromise) {
    wasmPromise = fetch("/wasm/telugu_akshara.wasm", { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`WASM request failed: ${response.status}`);
        const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
        return instance.exports as unknown as TeluguWasmExports;
      })
      .catch((error: unknown) => {
        wasmPromise = undefined;
        throw error;
      });
  }
  return wasmPromise;
}

export async function splitTeluguAksharas(text: string): Promise<string[]> {
  const input = new TextEncoder().encode(text);
  if (input.length > MAX_INPUT_BYTES) throw new RangeError("Text is too long to analyze");

  const wasm = await loadWasm();
  new Uint8Array(wasm.memory.buffer, wasm.input_ptr(), input.length).set(input);

  const outputLength = wasm.analyze(input.length);
  if (outputLength === 0xffffffff) throw new Error("Rust could not analyze this text");
  if (outputLength === 0) return [];

  const output = new Uint8Array(wasm.memory.buffer, wasm.output_ptr(), outputLength);
  return new TextDecoder().decode(output).split("\u001f");
}