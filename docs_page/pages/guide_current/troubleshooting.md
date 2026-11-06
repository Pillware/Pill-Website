# Troubleshooting

This page covers common issues and their solutions when working with Pill.

## Build Issues

### Cargo Build Fails

**Problem**: `cargo build` fails with compilation errors.

**Solutions**:

1. **Update Rust toolchain**:
   ```powershell
   rustup update
   ```

2. **Clean build cache**:
   ```powershell
   cargo clean
   cargo build --release
   ```

3. **Check Rust version**:
   ```powershell
   rustc --version
   ```
   Pill requires Rust 1.70 or later.

4. **Verify dependencies**:
   Make sure all path dependencies in `Cargo.toml` are correct:
   ```toml
   [dependencies]
   pill_engine = { path = "../Pill-Engine/engine/pill_engine" }
   ```

### Linker Errors on Windows

**Problem**: Linker errors like `LINK : fatal error LNK1181`.

**Solutions**:

1. **Install Visual Studio Build Tools**:
   - Download from [Visual Studio](https://visualstudio.microsoft.com/downloads/)
   - Select "Desktop development with C++"

2. **Verify MSVC is installed**:
   ```powershell
   cargo --version --verbose
   ```
   Should show `host: x86_64-pc-windows-msvc`

### DLL Not Found Errors

**Problem**: "The program can't start because *.dll is missing".

**Solutions**:

1. **Build in release mode**:
   ```powershell
   cargo build --release
   ```

2. **Check DLL path**:
   Make sure the DLL is in the same directory as the executable or in the path.

3. **Rebuild dependencies**:
   ```powershell
   cargo clean
   cargo build --release
   ```

## Runtime Issues

### Black Screen on Startup

**Problem**: Window opens but shows only a black screen.

**Solutions**:

1. **Check camera setup**:
   ```rust
   // Ensure camera is enabled and has proper settings
   CameraComponent::builder()
       .enabled(true)  // Must be true!
       .fov(60.0)
       .clear_color(Color::new(0.5, 0.5, 0.5))
       .build()
   ```

2. **Verify scene is active**:
   ```rust
   let scene = engine.create_scene("Main")?;
   engine.set_active_scene(scene)?;  // Don't forget this!
   ```

3. **Check entity has mesh and material**:
   ```rust
   .with_component(MeshRenderingComponent::builder()
       .mesh(&mesh_handle)      // Valid handle?
       .material(&material_handle)  // Valid handle?
       .build())
   ```

4. **Verify camera position**:
   Make sure the camera can see your entities.

### Crash on Startup

**Problem**: Application crashes immediately.

**Solutions**:

1. **Check config.ini**:
   ```ini
   [window]
   title = "My Game"
   width = 1280
   height = 720
   ```

2. **Enable debug mode**:
   ```powershell
   cargo run  # Debug build shows more error info
   ```

3. **Check resource paths**:
   ```rust
   // Make sure files exist at these paths
   Mesh::new("Truck", "models/Truck.obj".into())  // Check: res/models/Truck.obj exists?
   ```

4. **Verify all components are registered**:
   ```rust
   engine.register_component::<TransformComponent>(scene)?;
   // Register ALL components before creating entities!
   ```

### Low FPS / Performance Issues

**Problem**: Game runs slowly or stutters.

**Solutions**:

1. **Build in release mode**:
   ```powershell
   cargo build --release
   ```
   Debug builds are 10-100x slower!

2. **Check MSAA settings** in `config.ini`:
   ```ini
   [graphics]
   msaa = 4  # Try 0 or 2 for better performance
   ```

3. **Reduce polygon count**:
   - Simplify 3D models
   - Use lower-resolution textures
   - Remove unnecessary entities

4. **Profile your systems**:
   ```rust
   fn my_system(engine: &mut Engine) -> Result<()> {
       let start = std::time::Instant::now();
       
       // Your code here
       
       println!("System took: {:?}", start.elapsed());
       Ok(())
   }
   ```

5. **Limit entity iteration**:
   ```rust
   // Avoid iterating all entities every frame if possible
   // Cache data when you can
   ```

## Physics Issues

### Objects Fall Through Floor

**Problem**: Dynamic objects pass through static colliders.

**Solutions**:

1. **Check collider setup**:
   ```rust
   // Floor (static)
   .with_component(RigidBodyComponent::builder()
       .body_type(RigidBodyType::Fixed)  // Must be Fixed!
       .build())
   .with_component(ColliderComponent::builder()
       .shape(SharedShape::cuboid(10.0, 0.5, 10.0))  // Match mesh size
       .build())
   
   // Object (dynamic)
   .with_component(RigidBodyComponent::builder()
       .body_type(RigidBodyType::Dynamic)
       .build())
   .with_component(ColliderComponent::builder()
       .shape(SharedShape::ball(1.0))  // Match mesh size
       .mass(10.0)  // Don't forget mass!
       .build())
   ```

2. **Check physics timestep** in `config.ini`:
   ```ini
   [physics]
   timestep = 0.016667  # 60 FPS
   ```

3. **Verify collider sizes**:
   Make sure collider shapes match visual meshes reasonably well.

### Objects Won't Move

**Problem**: Dynamic objects don't respond to forces.

**Solutions**:

1. **Check body type**:
   ```rust
   RigidBodyComponent::builder()
       .body_type(RigidBodyType::Dynamic)  // Not Fixed or Kinematic
       .build()
   ```

2. **Verify mass**:
   ```rust
   ColliderComponent::builder()
       .mass(10.0)  // Must be > 0 for dynamic objects
       .build()
   ```

3. **Check if gravity is enabled**:
   ```ini
   [physics]
   gravity = -9.81  # Negative for downward
   ```

### Jittery Physics

**Problem**: Objects shake or vibrate.

**Solutions**:

1. **Add damping**:
   ```rust
   RigidBodyComponent::builder()
       .body_type(RigidBodyType::Dynamic)
       .linear_damping(0.5)   // Reduces movement
       .angular_damping(0.5)  // Reduces rotation
       .build()
   ```

2. **Adjust collision properties**:
   ```rust
   ColliderComponent::builder()
       .friction(0.5)      // Surface friction
       .restitution(0.3)   // Bounciness (lower = less bounce)
       .build()
   ```

3. **Use continuous collision detection**:
   For fast-moving objects, enable CCD (check engine docs).

## Resource Loading Issues

### Model Not Rendering

**Problem**: Mesh doesn't appear even though code seems correct.

**Solutions**:

1. **Verify file exists**:
   Check that `res/models/YourModel.obj` exists.

2. **Check model format**:
   - Must be OBJ format
   - Should have normals and UVs
   - No extreme polygon counts

3. **Verify resource handle**:
   ```rust
   let mesh = engine.add_resource(Mesh::new("Test", "models/Test.obj".into()))?;
   // Make sure this doesn't error!
   ```

4. **Check material setup**:
   Objects need both mesh AND material to render.

### Texture Not Loading

**Problem**: Model shows up but texture is missing or wrong.

**Solutions**:

1. **Check texture path**:
   ```rust
   Texture::new(
       "MyTexture",
       TextureType::Color,
       ResourceLoadType::Path("textures/MyTexture.png".into())  // Check this path!
   )
   ```

2. **Verify texture format**:
   - Supported: PNG, JPEG, BMP, TGA
   - RGB or RGBA
   - Power-of-2 dimensions recommended (512x512, 1024x1024, etc.)

3. **Check material binding**:
   ```rust
   Material::builder("MyMaterial")
       .texture("Color", texture_handle)?  // Make sure this is correct
       .build()
   ```

### Audio Not Playing

**Problem**: No sound or audio source not working.

**Solutions**:

1. **Check audio listener**:
   ```rust
   // Must have one AudioListenerComponent in scene
   engine.build_entity(scene)
       .with_component(CameraComponent::default())
       .with_component(AudioListenerComponent::builder()
           .enabled(true)
           .build())
       .build();
   ```

2. **Verify audio source**:
   ```rust
   AudioSourceComponent::builder()
       .audio_clip(&clip_handle)
       .volume(1.0)      // 0.0 = silent, 1.0 = full volume
       .looping(true)    // For continuous sounds
       .play_on_start(true)  // Start immediately
       .build()
   ```

3. **Check file format**:
   - Supported: WAV, OGG, MP3
   - Not corrupted
   - Reasonable file size

4. **Verify Windows audio**:
   Make sure your system volume is up and not muted.

## Networking Issues

### Cannot Connect to Server

**Problem**: Client can't connect to server.

**Solutions**:

1. **Check server address**:
   ```rust
   let server_addr = "127.0.0.1:5000";  // Correct IP and port?
   ```

2. **Verify server is running**:
   Make sure the server application started successfully.

3. **Check firewall**:
   Windows Firewall might block the connection. Add exception if needed.

4. **Enable net feature**:
   ```toml
   [dependencies]
   pill_engine = { path = "../Pill-Engine/engine/pill_engine", features = ["net"] }
   ```

5. **Use conditional compilation**:
   ```rust
   #[cfg(feature = "net")]
   {
       // Networking code here
   }
   ```

### Entity Sync Issues

**Problem**: Entities don't synchronize properly between clients.

**Solutions**:

1. **Verify NetworkStateComponent**:
   ```rust
   NetworkStateComponent {
       net_entity_id: unique_id,  // Must be unique per entity!
       owner_id: client_id,
       state: NetEntityState::Spawn,
       transform: Some(transform.clone()),
   }
   ```

2. **Check update frequency**:
   Balance between bandwidth and responsiveness.

3. **Add networking system**:
   ```rust
   engine.add_system("NetworkingClient", pill_engine::networking_system_client)?;
   ```

## Hot Reloading Issues

### Changes Not Reloading

**Problem**: Code changes don't reflect in running game.

**Solutions**:

1. **Rebuild the library**:
   ```powershell
   cargo build
   ```
   Hot-reload only works if you rebuild!

2. **Check file watcher**:
   Make sure `pill_standalone` is monitoring the correct DLL.

3. **Verify DLL output**:
   ```powershell
   cargo build --message-format=short
   ```
   Check that the DLL is actually being updated.

4. **Try restarting**:
   Sometimes a full restart is needed after major changes.

## Editor / IDE Issues

### rust-analyzer Errors

**Problem**: VS Code shows errors that don't exist or won't go away.

**Solutions**:

1. **Reload window**:
   - Press `Ctrl+Shift+P`
   - Type "Reload Window"
   - Press Enter

2. **Restart rust-analyzer**:
   - Press `Ctrl+Shift+P`
   - Type "rust-analyzer: Restart server"
   - Press Enter

3. **Check Cargo.toml**:
   Make sure all dependencies are valid.

4. **Clean and rebuild**:
   ```powershell
   cargo clean
   cargo build
   ```

### Slow Autocomplete

**Problem**: IDE is slow or unresponsive.

**Solutions**:

1. **Disable unnecessary features**:
   In settings.json:
   ```json
   {
     "rust-analyzer.checkOnSave.command": "clippy",
     "rust-analyzer.cargo.loadOutDirsFromCheck": false
   }
   ```

2. **Increase memory limit**:
   Close other applications to free up RAM.

3. **Exclude target directories**:
   ```json
   {
     "files.watcherExclude": {
       "**/target/**": true
     }
   }
   ```

## Getting More Help

If your issue isn't covered here:

1. **Check example projects**: See how they handle similar situations
2. **Enable debug logging**: Add `println!()` statements to understand flow
3. **Read error messages carefully**: They often point to the exact problem
4. **Search GitHub issues**: Someone might have had the same problem
5. **Create a minimal reproduction**: Simplify your code to isolate the issue

### Creating a Bug Report

When reporting issues, include:

- **Rust version**: `rustc --version`
- **OS and version**: Windows 10/11, etc.
- **Minimal code example**: Smallest code that reproduces the issue
- **Error messages**: Full error text with backtrace
- **What you expected**: What should happen
- **What actually happened**: What went wrong

### Useful Debug Commands

```powershell
# Check Rust installation
rustc --version
cargo --version

# Verbose build output
cargo build --verbose

# Run with backtrace
$env:RUST_BACKTRACE=1; cargo run

# Check dependencies
cargo tree

# Clean everything
cargo clean
Remove-Item -Recurse -Force target/
```

## Common Error Messages

### "Cannot find crate for `pill_engine`"

Fix: Check the path in Cargo.toml points to the correct location.

### "No such file or directory (os error 2)"

Fix: Resource file doesn't exist. Check the path and filename.

### "Thread 'main' panicked at..."

Fix: Check the line number and error message. Often indicates:
- Missing component registration
- Invalid handle use
- Resource not found

### "Borrow checker error"

Fix: You're trying to borrow engine mutably multiple times. Restructure your code to release borrows earlier.

## Performance Benchmarks

Expected performance on modern hardware:

- **1000 static entities**: 60+ FPS
- **100 dynamic physics objects**: 60 FPS
- **Simple game**: 60-144 FPS
- **Complex scene**: 30-60 FPS

If you're below these, check the performance optimization section in [Next Steps](/guide_current/next-steps).

---

Still stuck? Feel free to open an issue on [GitHub](https://github.com/Pillware/Pill/issues) with details about your problem!

You can also reach out to us at `contact&#64;pillengine&#46;org`