# Pill Project Coding Standards  

This document defines coding standards for the Pill project, ensuring consistency, readability, maintainability, and idiomatic language practices.  

## General Principles

These principles guide every decision in the codebase. When a rule isn't
clear, fall back to these.

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | Safety first | Prefer safe Rust. Only reach for `unsafe` when performance measurements or FFI boundaries leave no alternative. |
| 2 | Idiomatic Rust | Follow standard library conventions. Avoid clever abstractions that fight the borrow checker or obscure intent. |
| 3 | Clarity over brevity | Write code for the next person reading it. Use descriptive names, extract complex expressions, and comment the *why*. |
| 4 | Explicit imports | Always import types, functions, and macros at the top of the file. Never rely on wildcard or implicit imports - `use anyhow::Result;`, not `use anyhow::*;`. |

## Code Style &amp; Naming

### Naming

Names are documentation. Choose them carefully.

| Category | Case | Example |
|----------|------|---------|
| Types (structs, enums, traits) | `PascalCase` | `PillRecipe`, `ProductionLine` |
| Functions, variables, modules | `snake_case` | `validate_recipe`, `batch_id` |
| Constants &amp; statics | `SCREAMING_SNAKE_CASE` | `MAX_BATCH_SIZE`, `NEXT_BATCH_ID` |
| Generics | short uppercase, or descriptive | `T`, `E`, `Response` |
| Resources (textures, sounds, models) | `snake_case` | `player_walk.png`, `explosion.wav` |
| Shader/material parameters | `snake_case` | `base_color`, `roughness` |

Abbreviations are forbidden. Shortening a word saves the writer a
moment but costs every reader who has to decode it later.
`env`, `dt`, `tex`, `ctx`, `fmt`, `rot`, `pos`, and any other truncation
must never appear in identifiers, module paths, or resource filenames.

The only permitted abbreviations are Rust language keywords whose canonical
form is already short: `mut`, `ref`, `ptr`, `len`, `idx`, `dyn`. These are
allowed because they are part of the language's vocabulary, not because they
happen to be short.

Long, verbose names are encouraged. `transform_component` is better than
`trans_cmp`. Let the compiler do the typing; humans need to understand.

### Formatting

- Run `cargo fmt` and `cargo clippy` before committing. Do not suppress
  clippy lints without documenting the reason.
- Break long expressions into intermediate variables rather than chaining
  calls across multiple lines.
- Keep function bodies short and single-purpose. If a function exceeds
  ~40 lines, consider extracting helpers.

## Project Structure

### Crates &amp; Modules

- Organize modules using clear, shallow directory hierarchies.
- Every folder containing Rust source must have a `mod.rs` that defines the
  module's public API and re-exports relevant items.
- Name crates and modules with `snake_case`: `pill_core`, `pill_render`.

### File Size &amp; Cohesion

- Keep files small and single-purpose. If a file exceeds ~500 lines, split it.
- Each module should own one clear responsibility. If you struggle to
  summarise what a module does in one sentence, it does too much.

### Shared Utilities

- Place cross-cutting helpers in `pill_core`. Do not duplicate utility
  functions across crates - centralise, then re-export.  

## Source File Layout

::: tip IMPORTANT - IMPORTANT - IMPORTANT
This section and the next one ([Comments &amp; Documentation](#comments-&-documentation)) are strongly interconnected as the comments are also used to define the structure of the code file.

It is highly recommended to read both sections first and immediately after see full single-block example in [Example Source File](#example-source-file) section.
:::

Every `.rs` file follows a fixed top-to-bottom order. This section defines
what goes where - separators, section ordering, and structural rules.
For how to write the comments themselves, see
[Comments &amp; Documentation](#comments--documentation).

<style>
.diagram { display:flex; flex-direction:column; align-items:center; gap:4px; font-family:inherit; margin-top:48px; margin-bottom:48px }
.diagram-arrow { color:#6b7280; font-size:20px; line-height:1; }
.diagram-box-1 { font-size:16px; width:320px; border-radius:4px; padding:10px 16px; text-align:center; border:2px solid #d64a4a; background:#1f1f1f; color:#e5e5e5; }
.diagram-box-2 { font-size:16px; width:100%; border-radius:4px; padding:10px 16px; text-align:center; border:2px solid #d64a4a; background:#1f1f1f; color:#e5e5e5; }
.diagram-repeat-group { position:relative; border:1px dashed #6b7280; padding:22px; display:flex; flex-direction:column; align-items:center; gap:4px; }
.diagram-repeat-label { position:absolute; left:-1px; top:50%; transform:translate(-50%,-50%) rotate(-90deg); font-size:13px; color:#9ca3af; white-space:nowrap; letter-spacing:0.05em; background:#1a1a1a; padding:2px 6px; }
</style>

<div class="diagram">

<div class="diagram-box-1">
  <strong>Header Comment</strong><br/>
  <small>file description</small>
</div>

<div class="diagram-arrow">↓</div>

<div class="diagram-box-1">
  <strong>Module-Level Attributes</strong><br/>
</div>

<div class="diagram-arrow">↓</div>

<div class="diagram-box-1">
  <strong>Includes</strong><br/>
  <div style="padding-top:10px; padding-bottom:10px">
    <div class="diagram-box-2"><small>std</small></div>
    <div class="diagram-arrow">↓</div>
    <div class="diagram-box-2"><small>external crates</small></div>
    <div class="diagram-arrow">↓</div>
    <div class="diagram-box-2"><small>current crate</small></div>
  </div>
</div>

<div class="diagram-arrow">↓</div>

<div class="diagram-box-1">
  <strong>Constants</strong><br/>
  <small>static &amp; const values</small>
</div>

<div class="diagram-arrow">↓</div>

<div class="diagram-repeat-group">
  <div class="diagram-box-1">
    <strong>Types Declaration</strong><br/>
    <small>structs, enums, traits</small>
  </div>
  <div class="diagram-arrow">↓</div>
  <div class="diagram-box-1">
    <strong>Type Implementations</strong><br/>
    <small>methods &amp; trait impls</small>
  </div>
  <div class="diagram-repeat-label">repeat as needed</div>
</div>

<div class="diagram-arrow">↓</div>

<div class="diagram-box-1">
  <strong>General Functions</strong><br/>
  <small>free functions &amp; helpers</small>
</div>

<div class="diagram-arrow">↓</div>

<div class="diagram-box-1">
  <strong>Tests</strong><br/>
  <small>unit &amp; integration tests</small>
</div>

</div>

The example used throughout is a hypothetical `pill_factory` module - a
self-contained illustration of the layout rules.

---

### 1. Header Comment

The file must open with a `//!` module-level doc comment.

For the required structure and writing rules, see
[Module-Level Comments](#module-level-comments)

---

### 2. Module-Level Attributes
Optional. Contains all the attributions required.  


```rust
#![warn(missing_docs)]
#![warn(clippy::pedantic)]
#![deny(unsafe_code)]
```

---

### 3. Includes
Contains all the includes required in the file.

```rust
// Standard library
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

// External crates
use anyhow::{ensure, Result};
use serde::{Deserialize, Serialize};

// Current crate
use crate::inventory::IngredientInventory;
use crate::quality::QualityInspector;
```
- Three groups, always in this order:
  1. Standard library (`std::…`)
  2. External crates (third-party dependencies)
  3. Current crate (`crate::…`)
- Each group is separated by a blank line and preceded by a `// Group name` comment.
- Within a group, imports are not further sorted. They follow logical proximity.

---

### 4. Constants
Optional. Contains all `const` and `static` items.

- Opened with a double-bar separator: `// =====…` (80 col).
- `pub` items appear before private ones.
- For doc-comment rules, see [Constants &amp; Statics](#constants--statics).

---

### 5. Types &amp; Implementations
Core of the file. 
Groups of multiple type declarations and implementations right below them.
Groups repeat multiple times.

Each type group follows a fixed sub-order:
1. Type declaration - `struct`, `enum`, or `trait`.
2. Inherent `impl` block(s) - methods on the type itself.
3. Trait `impl` block(s) - trait implementations for the type.

#### 5a. Type Declaration

- Separator comment names the type (`// =====…`).
- Derive macros go on the same line as `#[derive(…)]`.
- For doc-comment rules, see [Types](#types-structs-enums-traits).

#### 5b. Inherent Implementation

- Single-dash separator (`// -----…`) divides methods into logical groups
  (e.g. *Construction*, *Property getters*, *Production*).
- Groups appear in order of typical call-site usage: construct first, then queries, then mutations.
- For doc-comment and step-label rules, see [Functions &amp; Methods](#functions--methods) and
  [Step Labels](#step-labels).

#### 5c. Trait Implementation

- Trait impls come after all inherent impl blocks for the same type.
- For doc-comment rules, see [Functions &amp; Methods](#functions--methods).

---

### 6. General Functions

- Free functions and module-level helpers that do not belong to any single
  type live here.
- For doc-comment, step-label, and safety-comment rules, see
  [Functions &amp; Methods](#functions--methods),
  [Step Labels](#step-labels), and
  [Safety Comments](#safety-comments).

---

### 7. Tests

- Always the last section in the file.
- Wrapped in `#[cfg(test)] mod tests { … }` with `use super::*;`.
- Test helpers (non-`#[test]` functions) appear before the test cases.
- Test function names describe the behaviour being verified, not the
  implementation detail.
- For doc-comment and step-label rules, see
  [Functions &amp; Methods](#functions--methods) and
  [Step Labels](#step-labels).

---

### Quick Reference

| # | Section | Separator | Contents |
|---|---------|-----------|----------|
| 1 | Header Comment | *(none)* | `//!` module doc |
| 2 | Attributes | *(none)* | `#![]` crate-level lints |
| 3 | Includes | `// Group` comments | `std` → extern → `crate` |
| 4 | Constants | `// ====…====` | `const` &amp; `static` |
| 5 | Types + Impls | `// ====…====` per type | struct/enum/trait → `impl` → trait `impl` |
| 6 | General Functions | `// ====…====` | free functions &amp; helpers |
| 7 | Tests | `// ====…====` | `#[cfg(test)] mod tests` |

## Comments &amp; Documentation

This section is the single reference for how to write every kind of comment
in a Pill source file. For where each comment kind belongs in the file
layout, see [Source File Layout](#source-file-layout).

### Module-Level Comments

Every file opens with a `//!` block. See the [Header Comment](#_1-header-comment)
section in Source File Layout for the required structure
(`# Responsibilities` / `# Design`).

| Section | Required? | Purpose |
|---------|-----------|---------|
| One/Two-line summary | Yes | Few first lines; states what the file provides. |
| `# Responsibilities` | Yes | Bullet list of what this module owns. |
| `# Design` | Recommended | Architectural notes, cross-type relationships. |

- Use intra-doc links to reference key types: `` [`PillFactory`] ``.

---

### Item-Level Comments

Every public and private item carries a `///` doc comment.   
Private items use `///` when their behaviour is non-trivial.

#### Types (structs, enums, traits)

2-4 lines: a 1-line summary followed by 1-3 lines of elaboration.

```rust
/// Physical shape produced by the pill press.
///
/// The shape determines the tooling used during manufacturing and influences
/// the pill's appearance and ease of swallowing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PillShape {
    /// A conventional circular pill.
    Round,
    /// An elongated pill with rounded ends.
    Capsule,
    /// A pill divided by a central score line.
    Scored,
}
```

- Summary line explains what the type represents.
- Elaboration explains why it exists or its role in the system.
- Enum variants each get their own `///` line.

#### Functions &amp; Methods

```rust
/// Validates a pill recipe before production begins.
///
/// # Errors
///
/// Returns an error if the name is empty, the active ingredient is missing, or
/// the recipe produces a pill with zero total weight.
fn validate_recipe(recipe: &PillRecipe) -> Result<()> { /* … */ }
```

| Section | When to use |
|---------|-------------|
| *(summary line)* | Always. Describes what the function does. |
| `# Errors` | When returning `Result`. Lists every error condition. |
| `# Safety` | When the function is `unsafe`. Lists every caller obligation. |
| `# Examples` | For key public API surfaces. Minimal working call. |

- Summary uses third-person indicative: *"Validates a pill recipe"*, not *"Validate"*.
- `# Errors` lists every way the function can fail, not just the common ones.
- `# Safety` is a contract: violation means undefined behaviour.

#### Constants &amp; Statics

```rust
/// Maximum number of pills permitted in a single batch.
pub const MAX_BATCH_SIZE: u32 = 10_000;
```

- One `///` line stating what the value represents.
- Mention external constraints if relevant (*"Limited by the press die diameter."*).

---

### Inline Comments

Used for implementation detail - things a reader needs that don't belong in public API docs.(`//`)

#### Step Labels

Multi-phase functions label each phase with `// Step N: …`.

- Use only when the function has 2+ distinct phases.
- Each label sits on its own line immediately above the code it describes.
- Aim for 2&ndash;4 steps. If you need 8+, split the function.

#### Explanatory Comments

Place a `//` comment above any block whose purpose isn't obvious from the code.

```rust
// Convert the supplied name once and store its owned representation.
let name = name.into();

// The subtraction is safe because the quality inspector cannot reject more
// pills than were produced.
let accepted_count = requested_count
    .checked_sub(rejected_count)
    .expect("quality inspector returned more rejections than produced pills");
```

- Explain what and why - not how (the code already shows how).
- Place on the line immediately above the code, no blank line between.
- One comment per logical block; don't comment every line.
- Avoid restating the obvious: `// increment i` is noise.

---

### Safety Comments

Every `unsafe` block must be preceded by a `// SAFETY:` comment justifying
why the operations are sound.

```rust
// SAFETY: Disjoint per-pill access guaranteed by the single-threaded
// factory scheduler. Both slices are valid for the lifetime of the
// batch. The caller guarantees `inspection_results.len() ==
// acceptance_buffer.len()`, so unchecked indexing through
// `get_unchecked` and `get_unchecked_mut` is sound. Mutating
// `acceptance_buffer[index]` without atomics is safe because no
// other thread observes this batch's inspection data.
unsafe {
    let count = inspection_results.len();
    for index in 0..count {
        let passed = *inspection_results.get_unchecked(index);
        if passed {
            *acceptance_buffer.get_unchecked_mut(index) += 1;
        }
    }
}
```

Every `SAFETY` comment must address the relevant safety dimensions:

| Category | Question the comment must answer |
|----------|----------------------------------|
| Aliasing | Why is there no overlapping `&mut` access? |
| Lifetime | Why are pointers/references valid for the duration of use? |
| Bounds | Why is unchecked indexing/pointer arithmetic within bounds? |
| Concurrency | Why are atomics unnecessary (or, if used, why is the ordering correct)? |
| Type validity | Why does the memory represent a valid instance of the target type? |
| Invariants | What caller guarantees or local invariants does this code rely on? |

- `// SAFETY:` uses UPPERCASE and a colon.
- It appears inside the function body, immediately before `unsafe {`.
- Written in prose, not bullet points.
- For `pub unsafe` functions, the `/// # Safety` section documents caller
  obligations; the `// SAFETY:` inside the body documents why this
  implementation satisfies them.  

### Examples in Comments

Runnable `# Examples` sections in `///` doc comments are welcome - they
double as documentation and as compile-tested usage samples. While not
required for every item, they are especially valuable on key public types
and functions.

```rust
/// Coordinates inventory, manufacturing, and quality inspection.
///
/// Owns the ingredient inventory and quality inspector and orchestrates
/// batch production through the [`ProductionLine`] trait.
///
/// # Examples
///
/// ```
/// # use pill_factory::{PillFactory, PillRecipe, PillShape, ProductionLine};
/// # use pill_factory::inventory::IngredientInventory;
/// # use pill_factory::quality::QualityInspector;
/// let inventory = IngredientInventory::default();
/// let inspector = QualityInspector::new(/* … */);
/// let mut factory = PillFactory::new(inventory, inspector);
///
/// let recipe = PillRecipe::new("Aspirin", PillShape::Round, 100, 40, 10);
/// let report = factory.manufacture(&recipe, 1_000)?;
///
/// assert!(report.accepted_count() > 0);
/// # Ok::<(), anyhow::Error>(())
/// ```
pub struct PillFactory { /* … */ }
```

Rules:

- The example must compile - `cargo test` runs doc-tests by default.
- Use `# ` to hide setup lines (imports, helper construction) from the
  rendered output while keeping them visible in the source.
- Keep examples minimal: construct one instance, call one method, assert one
  outcome.
- If the example can't compile in a doc-test (e.g. references a fictional
  crate path), wrap it in ` ```ignore` instead of ` ```rust`.
- The `# Examples` section goes after `# Errors` / `# Safety` (if present),
  immediately before the item definition.

### Test Documentation

Every `#[test]` function carries a `///` doc comment with a fixed structure:

1. First line - states what the test verifies. Third-person indicative:
   *"Tests that removing a component migrates the entity to a new archetype."*

2. `This test verifies that:` - bullet list of every condition under test.
   Each bullet corresponds to an assertion or logical check in the test body.

3. `Expected results:` - bullet list of the concrete outcomes. These are
   machine-checkable: every line should map to an `assert!` / `assert_eq!`.

```rust
/// Tests that removing a component migrates the entity to a new archetype.
///
/// This test verifies that:
/// - A component can be removed from an entity with multiple components
/// - The entity is migrated to a new archetype without the removed component
/// - Other components remain intact on the entity
/// - The old archetype is automatically cleaned up when empty
///
/// Expected results:
/// - remove_component returns Ok(())
/// - The entity still exists in entity_locations
/// - Only 1 archetype remains (the old one is deleted)
/// - The new archetype does not contain the removed component type
#[test]
fn entity_migrates_archetype_on_component_removal() { /* … */ }
```

Test helpers (preset constructors, builders) only need a one-line `///`
summary of what they create.

## Error Handling

### Recoverable Errors

Use `Result<T, E>` for any operation that can fail. Never use panics for
expected failure modes - panics are for unrecoverable logic errors only.

```rust
fn validate_recipe(recipe: &PillRecipe) -> Result<()> {
    ensure!(!recipe.name.trim().is_empty(), "recipe name cannot be empty");
    ensure!(recipe.active_ingredient_mg > 0, "recipe must contain an active ingredient");
    Ok(())
}
```

- In binary crates, prefer `anyhow::Result` and attach context with
  `.context("...")?` for richer diagnostics.
- In library crates, define and return specific error types so callers can
  match on variants.
- Use `bail!()` to early-exit with an error rather than constructing a
  `return Err(...)` by hand.

### Propagating Errors

Use the `?` operator extensively. It converts error types automatically
when the appropriate `From` impls exist and keeps the happy path clean.

```rust
fn manufacture(&mut self, recipe: &PillRecipe, count: u32) -> Result<ProductionReport> {
    validate_recipe(recipe)?;
    validate_batch_size(count)?;
    self.inventory.reserve_ingredients(recipe, count)?;
    // …
    Ok(report)
}
```

- Every fallible call on the happy path should end with `?`.
- If you need to add context before propagating, use
  `.context("while validating the recipe")?` instead of a `match` block.  

## Testing

### Structure

Tests live in a `#[cfg(test)] mod tests { … }` block at the bottom of the
file, with `use super::*;` to bring the parent module's items into scope.

```rust
#[cfg(test)]
mod tests {
    use super::*;

    /// Creates the standard recipe used by unit tests.
    fn test_recipe() -> PillRecipe {
        PillRecipe::new("Test Aspirin", PillShape::Round, 100, 40, 10)
    }

    /// Verifies that recipe weight includes every ingredient.
    #[test]
    fn calculates_total_pill_weight() {
        // Step 1: Create a recipe with a known material composition.
        let recipe = test_recipe();

        // Step 2: Verify the combined material weight.
        assert_eq!(recipe.total_weight_mg(), 150);
    }
}
```

- Test helpers (non-`#[test]` functions) appear before the test cases.
- Each helper carries a `///` doc comment explaining the preset it creates.
- If setup is shared by many tests, extract it into a helper rather than
  duplicating the setup in every test.

### What to Test

- Pure functions and data transformations- these are the highest-value
  tests. Given known inputs, assert known outputs.
- State transitions- create an object, call a mutating method, verify
  the object ends up in the expected state.
- Edge cases- empty collections, null or zero values, boundary
  conditions, maximum capacities.
- Error paths- verify that invalid operations return the expected error
  variant, not just that they fail.

Avoid testing implementation details. Tests should verify observable
behaviour and invariants- what the code does, not how it does it.

### Naming

Test function names describe the behaviour being verified, not the
implementation:

```rust
// Good - describes the observable outcome
fn recipe_weight_includes_every_ingredient() { /* … */ }
fn validating_empty_recipe_name_fails() { /* … */ }

// Bad - describes the implementation or is too vague
fn test_validate_recipe() { /* … */ }
fn test_case_4() { /* … */ }
```

### Assertions

- Use `assert_eq!` / `assert_ne!` with a descriptive message as the last
  argument. The message should explain what went wrong, not restate the
  assertion.
- Use `assert!` with a message for boolean conditions.
- For error variants, match against the exact enum variant rather than
  checking `is_err()`.

```rust
assert_eq!(
    result,
    Err(ValidationError::EmptyRecipeName),
    "validating a recipe with an empty name must return EmptyRecipeName"
);
```

### Doc-Tests

`# Examples` sections in `///` doc comments are run by `cargo test` as
doc-tests. They serve double duty: documentation for the reader and
compile-checked usage samples for the test suite. They are fully optional -
only add them where the value justifies the maintenance cost.

- Prefer doc-tests for API-level behaviour that a user of the type or
  function would care about.
- Keep them minimal: construct, call, assert - one interaction per example.
- Use `# ` to hide setup from the rendered output while keeping it
  compile-tested.
- If the example cannot compile in a doc-test, wrap it in ` ```ignore`.

For the full rules, see [Examples in Comments](#examples-in-comments).

### Test Documentation

For the full `///` doc-comment structure required on every `#[test]`
function, see [Test Documentation](#test-documentation) in the Comments
&amp; Documentation section.  

## Unsafe Code

Prefer safe Rust. Only reach for `unsafe` when there is no safe alternative
and the performance gain or FFI requirement is measurable and necessary.

`unsafe` does not mean the code is broken - it means the compiler cannot
verify its correctness on its own. That responsibility falls to you: you
must prove the code is sound and write that proof in a safety comment.

When `unsafe` is unavoidable:

- Encapsulate it. Wrap every `unsafe` block behind a safe abstraction.
  Callers should never need to write `unsafe { }` to use your API.
- Document it. Every `unsafe` block and every `pub unsafe fn` must carry
  the appropriate safety documentation. See
  [Safety Comments](#safety-comments) for the full rules - they apply here
  without exception.

If you find yourself reaching for `unsafe` to work around the borrow checker
and you cannot verify the safety of the code, stop. Reconsider the design
first.  

## Logging &amp; Observability

### Contextual Logging

Always pass an explicit `LogContext` to logging macros. The context carries
the subsystem name and enables per-subsystem log filtering at runtime.

```rust
info!(ctx => self.log, "batch {} started; {} pills requested", batch_id, count);
warn!(ctx => self.log, "quality inspector flagged {} anomalies", anomalies);
```

- Use the `"default"` context only when no subsystem context is available
  (e.g. one-shot CLI tools). Every long-lived component must own its context.
- Configure per-context verbosity with filters like `ecs=debug,renderer=info`.
  Follow the standard log-level semantics: `error` → `warn` → `info` → `debug`
  → `trace`.

### Message Style

- Write log messages in plain, descriptive English. No abbreviations.
- Prefer specific values over vague descriptions:
  `"texture atlas full (2048×2048, 64 regions)"` not `"tex full"`.
- Include relevant identifiers (`entity_id`, `batch_id`, `handle`) so logs
  are actionable during debugging.

### Performance Measurement

- Use the project's `Timer` utility to instrument functions, subsystems,
  and critical paths.
- Structure timing output with `begin_context` / `end_context` to produce
  hierarchical, readable profiles rather than flat lists of durations.  

## Code Review Expectations

Code review is a conversation, not a gate. Both authors and reviewers share
responsibility for keeping it constructive and efficient.

### For Authors

- Keep PRs small and focused on a single change.
- For architectural or design changes, open an issue or draft PR early to gather feedback before investing in implementation details.

### For Reviewers

- Review for correctness first: does the logic hold? Are edge cases
  handled?
- Review for clarity: can you understand the intent without asking the
  author to explain?
- Review for idiomatic usage: does the code follow the conventions in
  this document?
- Approve when the change is correct, clear, and idiomatic - not when it
  matches your personal style.

### Merge Requirements

A PR is ready to merge when:

1. All CI checks pass.
2. At least one reviewer has approved.
3. All review threads are resolved.

## Version Control

### Commit Messages

- Write commit messages that explain what changed and why. The diff
  already shows *how*.
- Keep commits atomic - each commit should do one thing and leave the
  project in a buildable state. It will also help the reviewers later on.
- Never commit generated files (build artifacts, IDE settings, lock files
  from tools outside the project's standard dependency manager).

### Pull Request Titles

Every PR title must follow the Conventional Commits format:

```
<type>(<optional-scope>): <description>
```

| Type | Use for |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `refactor` | Internal restructuring without behavioural changes |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Dependency, compiler, or build-tooling changes |
| `ci` | Continuous-integration changes |
| `chore` | Other maintenance tasks |

Examples:

- `feat(renderer): add PBR material pipeline`
- `fix(ecs): prevent archetype fragmentation on despawn`
- `docs: document the build process`
- `ci: add Clang builds to the matrix`

## Example Source File

The code block below is a complete, self-contained example illustrating every
layout rule, comment convention, and naming standard defined above - this is
what a real Pill source file looks like in practice.


```rust
//! Pill factory production and quality-control orchestration.
//!
//! # Responsibilities
//!
//! - Defines pill recipes and production results.
//! - Manages ingredient inventory and production batches.
//! - Coordinates pill pressing and quality inspection.
//! - Reports accepted and rejected pill counts.
//!
//! # Design
//!
//! A [`PillFactory`] owns the services required to manufacture pills.
//! Production is performed in discrete batches, and every batch receives a
//! unique identifier before ingredients are consumed.

#![warn(missing_docs)]
#![warn(clippy::pedantic)]
#![deny(unsafe_code)]

// Standard library
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

// External crates
use anyhow::{ensure, Result};
use serde::{Deserialize, Serialize};

// Current crate
use crate::inventory::IngredientInventory;
use crate::quality::QualityInspector;

// =============================================================================
// Constants
// =============================================================================

/// Maximum number of pills permitted in a single batch.
pub const MAX_BATCH_SIZE: u32 = 10_000;

/// Time required to press one pill.
const PRESS_DURATION_PER_PILL: Duration = Duration::from_micros(250);

/// Identifier assigned to the next production batch.
static NEXT_BATCH_ID: AtomicU64 = AtomicU64::new(1);

// =============================================================================
// PillShape
// =============================================================================

/// Physical shape produced by the pill press.
///
/// The shape determines the tooling used during manufacturing and influences
/// the pill's appearance and ease of swallowing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PillShape {
    /// A conventional circular pill.
    Round,
    /// An elongated pill with rounded ends.
    Capsule,
    /// A pill divided by a central score line.
    Scored,
}

// =============================================================================
// PillRecipe
// =============================================================================

/// Recipe used to manufacture a type of pill.
///
/// Defines the material composition (active ingredient, filler, and coating)
/// together with the physical shape produced by the pill press.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PillRecipe {
    name: String,
    shape: PillShape,
    active_ingredient_mg: u32,
    filler_mg: u32,
    coating_mg: u32,
}

impl PillRecipe {
    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    /// Creates a pill recipe.
    pub fn new(
        name: impl Into<String>,
        shape: PillShape,
        active_ingredient_mg: u32,
        filler_mg: u32,
        coating_mg: u32,
    ) -> Self {
        // Convert the supplied name once and store its owned representation.
        let name = name.into();

        Self {
            name,
            shape,
            active_ingredient_mg,
            filler_mg,
            coating_mg,
        }
    }

    // -------------------------------------------------------------------------
    // Property getters
    // -------------------------------------------------------------------------

    /// Returns the recipe's display name.
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Returns the physical shape produced from the recipe.
    pub fn shape(&self) -> PillShape {
        self.shape
    }

    /// Returns the total material required for one pill, in milligrams.
    pub fn total_weight_mg(&self) -> u32 {
        // Combine every material included in a finished pill.
        self.active_ingredient_mg + self.filler_mg + self.coating_mg
    }
}

// =============================================================================
// ProductionReport
// =============================================================================

/// Result of manufacturing one pill batch.
///
/// Captures the batch identifier, accepted and rejected pill counts, and the
/// estimated time spent on the production line.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProductionReport {
    batch_id: u64,
    requested_count: u32,
    accepted_count: u32,
    rejected_count: u32,
    production_duration: Duration,
}

impl ProductionReport {
    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /// Returns the unique production batch identifier.
    pub fn batch_id(&self) -> u64 {
        self.batch_id
    }

    /// Returns the number of pills requested for the batch.
    pub fn requested_count(&self) -> u32 {
        self.requested_count
    }

    /// Returns the number of pills accepted by quality control.
    pub fn accepted_count(&self) -> u32 {
        self.accepted_count
    }

    /// Returns the number of pills rejected by quality control.
    pub fn rejected_count(&self) -> u32 {
        self.rejected_count
    }

    /// Returns the estimated production duration.
    pub fn production_duration(&self) -> Duration {
        self.production_duration
    }
}

// =============================================================================
// ProductionLine
// =============================================================================

/// Interface implemented by pill-production facilities.
///
/// Defines the contract for manufacturing pill batches.
pub trait ProductionLine {
    /// Manufactures a batch according to the supplied recipe.
    ///
    /// # Errors
    ///
    /// Returns an error when the recipe is invalid, the requested batch size is
    /// unsupported, ingredients are unavailable, or quality inspection fails.
    fn manufacture(
        &mut self,
        recipe: &PillRecipe,
        requested_count: u32,
    ) -> Result<ProductionReport>;
}


// =============================================================================
// PillFactory
// =============================================================================

/// Coordinates inventory, manufacturing, and quality inspection.
///
/// Owns the ingredient inventory and quality inspector and orchestrates
/// batch production through the [`ProductionLine`] trait.
///
/// # Examples
///
/// ```
/// # use pill_factory::{PillFactory, PillRecipe, PillShape, ProductionLine};
/// # use pill_factory::inventory::IngredientInventory;
/// # use pill_factory::quality::QualityInspector;
/// let inventory = IngredientInventory::default();
/// let inspector = QualityInspector::new(/* … */);
/// let mut factory = PillFactory::new(inventory, inspector);
///
/// let recipe = PillRecipe::new("Aspirin", PillShape::Round, 100, 40, 10);
/// let report = factory.manufacture(&recipe, 1_000)?;
///
/// assert!(report.accepted_count() > 0);
/// # Ok::<(), anyhow::Error>(())
/// ```
pub struct PillFactory {
    inventory: IngredientInventory,
    quality_inspector: QualityInspector,
}

impl PillFactory {
    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    /// Creates a pill factory from its required production services.
    pub fn new(
        inventory: IngredientInventory,
        quality_inspector: QualityInspector,
    ) -> Self {
        Self {
            inventory,
            quality_inspector,
        }
    }
}

impl ProductionLine for PillFactory {
    /// Manufactures and inspects one batch of pills.
    ///
    /// # Errors
    ///
    /// Returns an error if validation, ingredient reservation, manufacturing,
    /// or quality inspection fails.
    fn manufacture(
        &mut self,
        recipe: &PillRecipe,
        requested_count: u32,
    ) -> Result<ProductionReport> {
        // Step 1: Validate inputs and reserve materials before changing state.
        validate_recipe(recipe)?;
        validate_batch_size(requested_count)?;
        self.inventory
            .reserve_ingredients(recipe, requested_count)?;

        // Step 2: Assign a batch identifier, then produce and inspect every pill.
        
        // Assign a unique batch identifier for this production run. The atomic
        let batch_id = NEXT_BATCH_ID.fetch_add(1, Ordering::Relaxed);

        // Manufacture the batch and inspect every pill for quality.
        let rejected_count = self
            .quality_inspector
            .inspect_batch(recipe, requested_count)?;

        // Step 3: Compute accepted count and commit the consumed ingredients.

        // The subtraction is safe because the quality inspector cannot reject more
        // pills than were produced.
        let accepted_count = requested_count
            .checked_sub(rejected_count)
            .expect("quality inspector returned more rejections than produced pills");
        self.inventory
            .consume_reserved_ingredients(recipe, requested_count)?;

        // Step 4: Build the production report.
        let report = ProductionReport {
            batch_id,
            requested_count,
            accepted_count,
            rejected_count,
            production_duration: estimate_production_duration(requested_count),
        };

        Ok(report)
    }
}

// =============================================================================
// General Functions
// =============================================================================

/// Validates a pill recipe before production begins.
///
/// # Errors
///
/// Returns an error if the name is empty, the active ingredient is missing, or
/// the recipe produces a pill with zero total weight.
fn validate_recipe(recipe: &PillRecipe) -> Result<()> {
    // Step 1: Require a human-readable recipe name.
    ensure!(
        !recipe.name.trim().is_empty(),
        "pill recipe name cannot be empty"
    );

    // Step 2: Require at least one milligram of active ingredient.
    ensure!(
        recipe.active_ingredient_mg > 0,
        "pill recipe must contain an active ingredient"
    );

    // Step 3: Reject recipes that produce an empty pill.
    ensure!(
        recipe.total_weight_mg() > 0,
        "pill recipe must have a non-zero total weight"
    );

    Ok(())
}

/// Validates a requested production batch size.
///
/// # Errors
///
/// Returns an error if the requested count is zero or exceeds
/// [`MAX_BATCH_SIZE`].
fn validate_batch_size(requested_count: u32) -> Result<()> {
    // Reject empty production batches.
    ensure!(requested_count > 0, "batch size must be greater than zero");

    // Protect the production line from unsupported batch sizes.
    ensure!(
        requested_count <= MAX_BATCH_SIZE,
        "batch size cannot exceed {MAX_BATCH_SIZE}"
    );

    Ok(())
}

/// Estimates how long the pill press needs to manufacture a batch.
fn estimate_production_duration(pill_count: u32) -> Duration {
    // Convert the pill count to the integer type expected by multiplication.
    let pill_count = u64::from(pill_count);

    // Calculate the duration without using floating-point arithmetic.
    PRESS_DURATION_PER_PILL.saturating_mul(pill_count as u32)
}

/// Counts accepted pills from a quality-inspection results buffer using
/// unchecked indexing. Used on the hot path during batch manufacture to
/// avoid bounds-checking overhead for every pill.
///
/// # Safety
///
/// The caller must guarantee that `inspection_results` and
/// `acceptance_buffer` share the same length. Both pointers must be
/// valid for the lifetime of the call.
unsafe fn count_accepted_pills_unchecked(
    inspection_results: &[bool],
    acceptance_buffer: &mut [u32],
) -> u32 {
    // SAFETY: Disjoint per-pill access guaranteed by the single-threaded
    // factory scheduler. Both slices are valid for the lifetime of the
    // batch. The caller guarantees `inspection_results.len() ==
    // acceptance_buffer.len()`, so unchecked indexing through
    // `get_unchecked` and `get_unchecked_mut` is sound. Mutating
    // `acceptance_buffer[index]` without atomics is safe because no
    // other thread observes this batch's inspection data.
    unsafe {
        let count = inspection_results.len();
        let mut accepted_total: u32 = 0;

        for index in 0..count {
            // Read the inspection flag without bounds checking.
            let passed = *inspection_results.get_unchecked(index);

            if passed {
                // Increment the acceptance counter for this pill slot.
                *acceptance_buffer.get_unchecked_mut(index) += 1;
                accepted_total += 1;
            }
        }

        accepted_total
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    /// Creates the standard recipe used by unit tests.
    fn test_recipe() -> PillRecipe {
        PillRecipe::new(
            "Test Aspirin",
            PillShape::Round,
            100,
            40,
            10,
        )
    }

    /// Verifies that recipe weight includes every ingredient.
    #[test]
    fn calculates_total_pill_weight() {
        // Step 1: Create a recipe with a known material composition.
        let recipe = test_recipe();

        // Step 2: Verify the combined material weight.
        assert_eq!(recipe.total_weight_mg(), 150);
    }

    /// Verifies that valid recipes pass validation.
    #[test]
    fn accepts_valid_recipe() {
        // Step 1: Create a complete pill recipe.
        let recipe = test_recipe();

        // Step 2: Validate the recipe.
        let result = validate_recipe(&recipe);

        // Step 3: Confirm that validation succeeded.
        assert!(result.is_ok());
    }
}
```