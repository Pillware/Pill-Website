# Pill Launcher - User Guide

## General User Guide

### What Is Pill Launcher?

**Pill Launcher** (`PillLauncher` or `PillLauncher.exe` on Windows) is the CLI build orchestrator for the Pill game engine. It compiles Pill projects to native executables (Windows/Linux/macOS) and WebAssembly (for the browser), manages the asset pipeline, scaffolds new projects from templates, and provides a development web server with live reload.

Think of it as the single tool you use to **create**, **build**, **run**, and **ship** a Pill project - no need to remember cargo flags, wasm-pack invocations, or asset-cooking commands.

### What Problems It Solves

| Without Pill Launcher                                                                        | With Pill Launcher                                                    |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Manually crafting `cargo build` with correct `-p` packages, features, and target directories | `PillLauncher build` does it all                                      |
| Setting up wasm-pack, wasm-bindgen, wasm-opt manually                                        | `PillLauncher build -t web` handles the entire WASM pipeline          |
| Copying templates by hand when starting a new project                                        | `PillLauncher create -n MyGame` scaffolds a working project instantly |
| No live reload during WASM development                                                       | `PillLauncher run -t web` starts a dev server with auto-reload        |
| Forgetting to cook assets before shipping                                                    | `PillLauncher build --clean` rebuilds everything from source          |

### Installation

Pill Launcher is part of the Pill-Engine repository. Build it once:

```bash
cargo build --release --manifest-path engine/pill_launcher/Cargo.toml
```

The binary will be at `engine/pill_launcher/target/release/PillLauncher` (or `.exe` on Windows). Add it to your `PATH` or use it directly.

**Prerequisites:** Rust toolchain (rustup), wasm-pack (for WASM builds: `cargo install wasm-pack`).

### First-Time Setup

```bash
# 1. Build the launcher
cargo build --release --manifest-path engine/pill_launcher/Cargo.toml

# 2. Create your first project
./engine/pill_launcher/target/release/PillLauncher create -n MyFirstGame

# 3. Build and run it
./engine/pill_launcher/target/release/PillLauncher run -p MyFirstGame
```

A window opens with a floating, rotating pill model - your project is working.

### Common Commands

| Command                                              | What it does                                   |
| ---------------------------------------------------- | ---------------------------------------------- |
| `PillLauncher create -n <name>`                      | Scaffold a new project from template           |
| `PillLauncher build -p <path>`                       | Compile to native executable (debug)           |
| `PillLauncher build -p <path> -c release`            | Compile for release                            |
| `PillLauncher build -p <path> -t web`                | Compile to WASM                                |
| `PillLauncher build -p <path> -t web --wasm-analyze` | Build WASM with size analysis                  |
| `PillLauncher build -p <path> --headless`            | Build for headless mode (no window/GPU)        |
| `PillLauncher run -p <path>`                         | Build and launch (native)                      |
| `PillLauncher run -p <path> -t web`                  | Build WASM and start dev server                |
| `PillLauncher run -p <path> --headless`              | Run in headless mode (benchmarking/CI)         |
| `PillLauncher assets -p <path>`                      | Run asset pipeline on `res/`                   |
| `PillLauncher cargo -p <path> -- check`              | Run `cargo check` in project context           |
| `PillLauncher docs -o <dir>`                         | Generate rustdoc for engine crates             |
| `PillLauncher link -p <path>`                        | Link project to engine workspace (IDE support) |
| `PillLauncher unlink`                                | Remove linked project                          |

### Typical Development Workflow

```bash
# Create
PillLauncher create -n MyGame

# Work on your game (edit src/project.rs, add assets to res/)

# Cook assets (after adding new models/textures)
PillLauncher assets -p MyGame

# Build and run (native, debug - fast iteration)
PillLauncher run -p MyGame

# Build WASM and test in browser
PillLauncher run -p MyGame -t web

# Final release build
PillLauncher build -p MyGame -c release
```

### Expected Outputs

**Native builds** produce:
```
MyGame/
├── build/
│   ├── dev/          ← debug
│   │   ├── MyGame(.exe)
│   │   └── data/
│   │       ├── project.dll/.so/.dylib
│   │       ├── pill_runtime.dll/.so/.dylib
│   │       └── res/  ← cooked assets
│   ├── release/      ← release (same layout)
│   └── hot-reload/   ← hot-reload mode
```

**WASM builds** produce:
```
MyGame/
└── build/
    └── wasm/
        ├── index.html
        ├── pill_web_app.js
        ├── pill_web_app_bg.wasm
        ├── pill_logo.png
        └── res/
```

### Common Errors

| Error                                              | Cause                     | Fix                                                                                                            |
| -------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `PillLauncher binary not found`                    | Launcher not built        | `cargo build --release --manifest-path engine/pill_launcher/Cargo.toml`                                        |
| `--name <name> is required`                        | Missing project name      | `PillLauncher create -n MyGame`                                                                                |
| `Project directory ... already exists`             | Duplicate create          | Choose a different name or remove the existing directory                                                       |
| `wasm-pack not found`                              | wasm-pack not installed   | `cargo install wasm-pack`                                                                                      |
| `Standalone executable was not built successfully` | Compilation error         | Check cargo output for the actual error                                                                        |
| `Address already in use` (port 8080)               | Stale dev server          | Kill lingering PillLauncher processes (`kill_server_on_port` in CI)                                            |
| `The wasm32-unknown-unknown are not supported…`    | Missing getrandom feature | Ensure `PILL_LAUNCHER_EXPERIMENTAL_LOGS` is not causing issues, or add `wasm_js` feature to getrandom for WASM |

### Build Modes

| Mode       | Flag                 | Use case                                              |
| ---------- | -------------------- | ----------------------------------------------------- |
| Debug      | `-c debug` (default) | Fast iteration, no optimizations                      |
| Release    | `-c release`         | Shipping, benchmarking, size measurement              |
| Hot-reload | `-c hot-reload`      | Edit-compile-reload without restarting                |
| Headless   | `--headless`         | Build without windowing/GPU (CI, headless benchmarks) |

### Advanced Build Flags

| Flag                        | Purpose                                                |
| --------------------------- | ------------------------------------------------------ |
| `--headless`                | Enable headless mode for native builds (no window/GPU) |
| `--additional-features <f>` | Pass comma-separated Cargo features to the project     |
| `--wasm-analyze`            | Run `twiggy` on the final `.wasm` for size breakdown   |
| `--max-wasm-size <KB>`      | Fail the build if the `.wasm` exceeds the given size   |
| `--wasm-port <port>`        | Override the dev server port (default 8080)            |

### Hot Reload

Hot reload lets you edit Rust source files and see changes without restarting your game:

```bash
PillLauncher run -p MyGame -c hot-reload
```

- The launcher starts your game and monitors `src/` for changes
- When you save a `.rs` file, the project DLL is recompiled and hot-swapped
- The game keeps running - state is preserved
- In WASM mode, the dev server watches `build/wasm/` and pushes reloads to the browser

**Limitations:** Structural changes (new structs, changed type layouts) may require a full restart. Hot reload works best for gameplay logic tweaks.

### Cache Management

The launcher uses per-project target directories under `engine/target_projects/<project_name>/`. To clean all caches:

```bash
# Clean a specific project
rm -rf engine/target_projects/MyGame

# Clean everything
cargo clean --manifest-path engine/Cargo.toml --release
```

Use `--clean` on build/run to rebuild cooked assets from source:
```bash
PillLauncher build -p MyGame -c release --clean
```
