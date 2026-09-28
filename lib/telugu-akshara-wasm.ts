/**
 * WebAssembly exports exposed by rust/telugu-akshara.
 */
interface TeluguWasmExports {
  memory: WebAssembly.Memory;
  // akshara splitting
  input_ptr: () => number;
  output_ptr: () => number;
  input_capacity: () => number;
  analyze: (inputLength: number) => number;
  // trace checking
  mask_side: () => number;
  drawn_mask_ptr: () => number;
  target_mask_ptr: () => number;
  score_trace: () => number;
}

const MAX_INPUT_BYTES = 8192; // early check before the WASM file is even loaded
const RUST_ERROR = 0xffffffff; // u32::MAX

let wasmPromise: Promise<TeluguWasmExports> | undefined;

/**
 * Fetches, instantiates and caches the WASM module (one instance for the whole app).
 */
function loadWasm(): Promise<TeluguWasmExports> {
  if (!wasmPromise) {
    wasmPromise = (async () => {
      const fetchPromise = fetch("/wasm/telugu_akshara.wasm");

      if (typeof WebAssembly.instantiateStreaming === "function") {
        try {
          const { instance } = await WebAssembly.instantiateStreaming(fetchPromise, {});
          return instance.exports as unknown as TeluguWasmExports;
        } catch (err) {
          console.warn("[WASM] instantiateStreaming failed, falling back to arrayBuffer:", err);
        }
      }

      const response = await fetchPromise;
      if (!response.ok) {
        throw new Error(`WASM request failed with status: ${response.status}`);
      }
      const bytes = await response.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(bytes, {});
      return instance.exports as unknown as TeluguWasmExports;
    })().catch((error: unknown) => {
      wasmPromise = undefined; // allow retry
      throw error;
    });
  }
  return wasmPromise;
}

/* ================= AKSHARA SPLITTING ================= */

/**
 * Splits Telugu text into aksharas using Rust.
 */
export async function splitTeluguAksharas(text: string): Promise<string[]> {
  if (!text || text.trim() === "") {
    return [];
  }

  const input = new TextEncoder().encode(text);
  if (input.length > MAX_INPUT_BYTES) {
    throw new RangeError("Text length exceeds the maximum allowed input limit.");
  }

  const wasm = await loadWasm();

  if (input.length > wasm.input_capacity()) {
    throw new RangeError("Text length exceeds the maximum allowed input limit.");
  }

  new Uint8Array(wasm.memory.buffer, wasm.input_ptr() >>> 0, input.length).set(input);

  // >>> 0 converts to unsigned: without it, u32::MAX arrives as -1
  const outputLength = wasm.analyze(input.length) >>> 0;

  if (outputLength === RUST_ERROR) {
    throw new Error("Rust WASM engine encountered an error parsing the text.");
  }
  if (outputLength === 0) {
    return [];
  }

  const outputBytes = new Uint8Array(
    wasm.memory.buffer,
    wasm.output_ptr() >>> 0,
    outputLength
  ).slice();

  return new TextDecoder().decode(outputBytes).split("\u001f").filter(Boolean);
}

/* ================= TRACE CHECKING ================= */

export type TraceScore = {
  /** % of the letter that the child traced */
  coverage: number;
  /** % of the child's strokes that stay on the letter */
  precision: number;
};

/** Side length of the square grid Rust compares (e.g. 64 → 64×64). */
export async function getTraceMaskSide(): Promise<number> {
  const wasm = await loadWasm();
  return wasm.mask_side();
}

/**
 * Compares the child's drawing with the letter shape using Rust.
 * Both masks are side×side alpha values (0–255), row by row.
 */
export async function scoreTraceMasks(drawn: Uint8Array, target: Uint8Array): Promise<TraceScore> {
  const wasm = await loadWasm();
  const side = wasm.mask_side();
  const cells = side * side;

  if (drawn.length !== cells || target.length !== cells) {
    throw new RangeError(`Trace masks must be ${side}×${side}.`);
  }

  new Uint8Array(wasm.memory.buffer, wasm.drawn_mask_ptr() >>> 0, cells).set(drawn);
  new Uint8Array(wasm.memory.buffer, wasm.target_mask_ptr() >>> 0, cells).set(target);

  const packed = wasm.score_trace() >>> 0;
  if (packed === RUST_ERROR) {
    throw new Error("Rust could not score the trace (empty letter shape).");
  }

  return { coverage: (packed >>> 8) & 0xff, precision: packed & 0xff };
}