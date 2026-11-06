# Setup

This guide will walk you through setting up Pill and creating your first project.

## Prerequisites

Before you begin, make sure you have the following installed:

### Required

- **Rust** (1.70 or later)
  - Install from [rustup.rs](https://rustup.rs/)
  - Verify installation: `rustc --version`

- **Cargo** (comes with Rust)
  - Verify installation: `cargo --version`

### Recommended

- **Visual Studio Code** with rust-analyzer extension
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Pillware/Pill.git
cd Pill-Engine
```

### 2. Install Rust

Install from [rustup.rs](https://www.rust-lang.org/tools/install)

### 3. Build Pill Launcher

```bash
`echo 'export PATH="$PATH:<PATH_TO_PILL>/Pill-Engine/engine/pill_launcher/target/release"' >> ~/.bashrc && source ~/.bashrc`
and restart terminal

cargo build --release --manifest-path <PATH_TO_PILL>\Pill\engine\pill_launcher\Cargo.toml
```

### 4. Add Pill Launcher to PATH (optional)

#### On Windows
Follow [these steps](https://superuser.com/questions/1861276/how-to-set-a-folder-to-the-path-environment-variable-in-windows-11)
And add add `<PATH_TO_PILL>\Pill\engine\pill_launcher\target\release`

#### On Linux
```bash
`echo 'export PATH="$PATH:<PATH_TO_PILL>/Pill-Engine/engine/pill_launcher/target/release"' >> ~/.bashrc && source ~/.bashrc`
```

## Creating new project

### 1. Create a new project

The empty template project will be created.

```bash
PillLauncher.exe -a create -n Hello-Pill
```

### 2. Run it!

```bash
PillLauncher.exe -a run -p ./Hello-Pill
```

## Examples
The easiest way to get started is to use one of the example projects:

Available examples:
- `Empty` - Minimal starting template
- `Floating-Pills` - Basic 3D scene
- `Trucks` - Vehicle controls and physics
- `Italian-Brainrot` - Custom shaders loading
- `Net-Minimal` - Networking basics

To run selected example use:
```bash
PillLauncher.exe -a run -p <PATH_TO_PILL>\Pill\examples\<EXAMPLE_NAME>
```

## Quicker iteration times (hot-reloading)
1. When running the game example add `-c hot-reload` to the PillLauncher flags
2. Run the example
`PillLauncher.exe -c hot-reload -a run -p ./Hello-Pill`
3. Change the code in your Editor
4. Observe the game briefly pausing and resuming with changed world state


## Next Steps

Now that you have Pill set up, learn about:

- [ECS (Entity Component System)](/guide_current/getting-started/ecs) - Core architecture
- [Resources](/guide_current/getting-started/resources) - Managing assets
- [Next Steps](/guide_current/next-steps) - Building more complex features
