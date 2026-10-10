/* tslint:disable */
/* eslint-disable */

/**
 * Smoothed frames per second; `null` until the first frame has run.
 */
export function get_fps(): number | undefined;

/**
 * Duration of the most recent frame in milliseconds.
 */
export function get_frame_time_ms(): number | undefined;

/**
 * Live pill count, counted the same way the project's spawner counts them.
 */
export function get_num_pills(): number | undefined;

/**
 * The site's reset button: the demo has no teardown path, so a reset replays
 * the spawn animation across the running stream instead of rebuilding it.
 */
export function reset_pills(): void;

/**
 * The site's "Spawn more pills" button: one press of the spawn key, which the
 * project maps to exactly one burst (see its `spawn_pills_system`).
 */
export function spawn_more_pills(): void;

/**
 * wasm-bindgen start hook: runs while the page's `init()` promise settles.
 *
 * Boot is asynchronous (adapter and device requests are browser promises),
 * so it continues on the microtask queue after `init` resolves; the getters
 * answer `null` until the first frame runs.
 */
export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly get_fps: () => [number, number];
    readonly get_frame_time_ms: () => [number, number];
    readonly get_num_pills: () => number;
    readonly reset_pills: () => void;
    readonly spawn_more_pills: () => void;
    readonly start: () => void;
    readonly pill_module_abi_version: () => number;
    readonly pill_module_init: (a: number) => number;
    readonly project_schema_fingerprint: () => bigint;
    readonly wasm_bindgen__convert__closures_____invoke__h89cc2031412e379e: (a: number, b: number, c: number) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h36b6fc4caf34249a: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen__convert__closures_____invoke__h741517cb49fb7da1: (a: number, b: number, c: any) => void;
    readonly __wbindgen_malloc_command_export: (a: number, b: number) => number;
    readonly __wbindgen_realloc_command_export: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store_command_export: (a: number) => void;
    readonly __externref_table_alloc_command_export: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free_command_export: (a: number, b: number, c: number) => void;
    readonly __wbindgen_destroy_closure_command_export: (a: number, b: number) => void;
    readonly __externref_table_dealloc_command_export: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
