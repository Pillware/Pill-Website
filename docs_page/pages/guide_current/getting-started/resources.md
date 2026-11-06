# Resources

Resources in Pill are shared assets like meshes, textures, materials, and audio clips. They are loaded once and can be referenced by multiple entities.

## Resource Management

Resources are managed through handles - lightweight references to the actual resource data. This allows multiple entities to share the same asset without duplication.

### Resource Types

- **Mesh**: 3D geometry data
- **Texture**: Image data for materials
- **Material**: Defines surface appearance
- **AudioClip**: Sound data for audio playback

## Meshes

Meshes contain the 3D geometry of objects.

### Loading Meshes

Load mesh files from your `res/models/` directory:

```rust
let mesh_handle = engine.add_resource(
    Mesh::new("Truck", "models/Truck.obj".into())
)?;
```

### Supported Formats

- **OBJ** (Wavefront): Standard 3D format
  - Supports vertices, normals, and UV coordinates
  - Can include multiple objects in one file

### Using Meshes

Attach meshes to entities with `MeshRenderingComponent`:

```rust
engine.build_entity(scene)
    .with_component(TransformComponent::default())
    .with_component(MeshRenderingComponent::builder()
        .mesh(&mesh_handle)
        .material(&material_handle)
        .build())
    .build();
```

### Best Practices

- **Optimize geometry**: Keep polygon count reasonable for real-time rendering
- **Share meshes**: Reuse mesh handles for multiple entities
- **Proper normals**: Ensure your models have correct normals for lighting

```rust
// Good: One mesh, many entities
let crate_mesh = engine.add_resource(Mesh::new("Crate", "models/Crate.obj".into()))?;

for i in 0..10 {
    engine.build_entity(scene)
        .with_component(TransformComponent::builder()
            .position(Vector3f::new(i as f32 * 2.0, 0.0, 0.0))
            .build())
        .with_component(MeshRenderingComponent::builder()
            .mesh(&crate_mesh) // Shared mesh handle
            .material(&material)
            .build())
        .build();
}
```

## Textures

Textures are images applied to 3D surfaces.

### Loading Textures

Load texture files from your `res/textures/` directory:

```rust
let color_texture = engine.add_resource::<Texture>(
    Texture::new(
        "WoodColor",
        TextureType::Color,
        ResourceLoadType::Path("textures/Wood.png".into())
    )
)?;
```

### Texture Types

Different texture types serve different purposes:

#### Color (Albedo)

Base color of the surface:

```rust
Texture::new(
    "BaseColor",
    TextureType::Color,
    ResourceLoadType::Path("textures/Color.png".into())
)
```

#### Normal Maps

Add surface detail without geometry:

```rust
Texture::new(
    "NormalMap",
    TextureType::Normal,
    ResourceLoadType::Path("textures/Normal.png".into())
)
```

#### Roughness/Metallic

PBR material properties:

```rust
Texture::new(
    "Roughness",
    TextureType::Roughness,
    ResourceLoadType::Path("textures/Roughness.png".into())
)
```

### Supported Formats

- PNG (recommended for transparency)
- JPEG (good for photos)
- BMP, TGA, HDR

### Texture Guidelines

1. **Power of 2 dimensions**: Use 256x256, 512x512, 1024x1024, etc.
2. **Compression**: Keep file sizes reasonable
3. **Mipmaps**: The engine generates these automatically
4. **UV mapping**: Ensure your 3D models have proper UV coordinates

## Materials

Materials define how surfaces appear by combining textures and parameters.

### Creating Materials

Use the material builder:

```rust
let material = engine.add_resource::<Material>(
    Material::builder("WoodMaterial")
        .texture("Color", color_texture_handle)?
        .texture("Normal", normal_texture_handle)?
        .color("Tint", Color::new(1.0, 1.0, 1.0))?
        .scalar("Specularity", 0.5)?
        .build()
)?;
```

### Material Properties

#### Textures

Assign textures to material slots:

```rust
Material::builder("MyMaterial")
    .texture("Color", color_texture)?      // Base color
    .texture("Normal", normal_texture)?    // Normal map
    .texture("Roughness", rough_texture)?  // Roughness map
```

#### Colors

Tint and modify appearance:

```rust
Material::builder("MyMaterial")
    .color("Tint", Color::new(1.0, 0.5, 0.2))?  // Orange tint
    .color("Emissive", Color::new(1.0, 1.0, 1.0))?  // Glow color
```

#### Scalars

Numeric parameters:

```rust
Material::builder("MyMaterial")
    .scalar("Specularity", 0.8)?   // 0.0 = matte, 1.0 = glossy
    .scalar("Metallic", 0.0)?      // 0.0 = dielectric, 1.0 = metal
    .scalar("Roughness", 0.3)?     // Surface roughness
    .scalar("Opacity", 1.0)?       // Transparency
```

### Complete Material Example

```rust
// Load textures
let wood_color = engine.add_resource::<Texture>(
    Texture::new(
        "WoodColor",
        TextureType::Color,
        ResourceLoadType::Path("textures/WoodColor.png".into())
    )
)?;

let wood_normal = engine.add_resource::<Texture>(
    Texture::new(
        "WoodNormal",
        TextureType::Normal,
        ResourceLoadType::Path("textures/WoodNormal.png".into())
    )
)?;

// Create material
let wood_material = engine.add_resource::<Material>(
    Material::builder("Wood")
        .texture("Color", wood_color)?
        .texture("Normal", wood_normal)?
        .color("Tint", Color::new(0.8, 0.6, 0.4))?  // Brown tint
        .scalar("Specularity", 0.3)?                 // Slightly glossy
        .build()
)?;

// Use in entity
engine.build_entity(scene)
    .with_component(TransformComponent::default())
    .with_component(MeshRenderingComponent::builder()
        .mesh(&crate_mesh)
        .material(&wood_material)
        .build())
    .build();
```

### Modifying Materials at Runtime

Get mutable access to modify materials during gameplay:

```rust
let material = engine.get_resource_mut::<Material>(&material_handle)?;
material.set_color("Tint", Color::new(1.0, 0.0, 0.0))?;  // Change to red
material.set_scalar("Specularity", 0.9)?;  // Make more glossy
```

This is useful for:
- Damage effects (changing color/texture)
- Power-ups (glowing effects)
- Environmental changes (wet/dry surfaces)

## Audio Resources

Audio clips for sound effects and music.

### Loading Audio

```rust
let audio_clip = engine.add_resource::<AudioClip>(
    AudioClip::new("Explosion", "audio/explosion.wav".into())
)?;
```

### Using Audio

Attach audio sources to entities:

```rust
engine.build_entity(scene)
    .with_component(TransformComponent::builder()
        .position(Vector3f::new(10.0, 0.0, 0.0))
        .build())
    .with_component(AudioSourceComponent::builder()
        .audio_clip(&audio_clip)
        .volume(0.8)
        .looping(false)
        .spatial(true)  // 3D positional audio
        .build())
    .build();
```

### Audio Listener

Add an audio listener (typically to the camera):

```rust
engine.build_entity(scene)
    .with_component(TransformComponent::default())
    .with_component(CameraComponent::default())
    .with_component(AudioListenerComponent::builder()
        .enabled(true)
        .build())
    .build();
```

### Supported Formats

- WAV (uncompressed, best quality)
- OGG (compressed, good for music)
- MP3 (compressed, widely supported)

## Resource Organization

### Directory Structure

Organize your resources in the `res/` directory:

```
res/
├── config.ini
├── models/
│   ├── Player.obj
│   ├── Enemy.obj
│   ├── Weapon.obj
│   └── Environment.obj
├── textures/
│   ├── PlayerColor.png
│   ├── PlayerNormal.png
│   ├── EnemyColor.png
│   └── GroundDirt.png
└── audio/
    ├── footstep.wav
    ├── gunshot.wav
    └── music.ogg
```

### Naming Conventions

Use clear, descriptive names:

```rust
// Good naming
let player_mesh = engine.add_resource(Mesh::new("PlayerMesh", "models/Player.obj".into()))?;
let player_color = engine.add_resource::<Texture>(
    Texture::new("PlayerColorTexture", TextureType::Color, ResourceLoadType::Path("textures/PlayerColor.png".into()))
)?;

// Avoid generic names
let mesh1 = engine.add_resource(Mesh::new("Mesh1", "models/Player.obj".into()))?;
let tex = engine.add_resource::<Texture>(
    Texture::new("Tex", TextureType::Color, ResourceLoadType::Path("textures/PlayerColor.png".into()))
)?;
```

## Resource Loading Patterns

### Preload Resources

Load all resources during `start()`:

```rust
impl PillGame for Game {
    fn start(&self, engine: &mut Engine) -> Result<()> {
        // Load all resources upfront
        let meshes = load_all_meshes(engine)?;
        let materials = load_all_materials(engine)?;
        
        // Then create entities using loaded resources
        create_entities(engine, &meshes, &materials)?;
        
        Ok(())
    }
}

fn load_all_meshes(engine: &mut Engine) -> Result<HashMap<String, MeshHandle>> {
    let mut meshes = HashMap::new();
    
    meshes.insert("Player".into(), 
        engine.add_resource(Mesh::new("Player", "models/Player.obj".into()))?);
    meshes.insert("Enemy".into(),
        engine.add_resource(Mesh::new("Enemy", "models/Enemy.obj".into()))?);
    
    Ok(meshes)
}
```

### Store Handles

Keep resource handles for easy access:

```rust
pub struct GameResources {
    // Meshes
    pub player_mesh: MeshHandle,
    pub enemy_mesh: MeshHandle,
    
    // Materials
    pub player_material: MaterialHandle,
    pub enemy_material: MaterialHandle,
    
    // Audio
    pub shoot_sound: AudioClipHandle,
}

impl GlobalComponent for GameResources {}
impl PillTypeMapKey for GameResources {
    type Storage = GlobalComponentStorage<Self>;
}

// Load and store
let resources = GameResources {
    player_mesh: engine.add_resource(Mesh::new("Player", "models/Player.obj".into()))?,
    enemy_mesh: engine.add_resource(Mesh::new("Enemy", "models/Enemy.obj".into()))?,
    // ... etc
};
engine.add_global_component(resources)?;

// Use in systems
fn spawn_enemy_system(engine: &mut Engine) -> Result<()> {
    let resources = engine.get_global_component::<GameResources>()?;
    
    engine.build_entity(scene)
        .with_component(TransformComponent::default())
        .with_component(MeshRenderingComponent::builder()
            .mesh(&resources.enemy_mesh)
            .material(&resources.enemy_material)
            .build())
        .build();
    
    Ok(())
}
```

## Advanced: Procedural Materials

Create materials programmatically for dynamic effects:

```rust
fn create_team_materials(engine: &mut Engine, base_texture: TextureHandle) -> Result<Vec<MaterialHandle>> {
    let colors = vec![
        Color::new(1.0, 0.0, 0.0),  // Red team
        Color::new(0.0, 0.0, 1.0),  // Blue team
        Color::new(0.0, 1.0, 0.0),  // Green team
    ];
    
    let mut materials = Vec::new();
    for (i, color) in colors.iter().enumerate() {
        let material = engine.add_resource::<Material>(
            Material::builder(&format!("Team{}", i))
                .texture("Color", base_texture)?
                .color("Tint", *color)?
                .scalar("Specularity", 0.5)?
                .build()
        )?;
        materials.push(material);
    }
    
    Ok(materials)
}
```

## Performance Considerations

### Resource Sharing

Always share resources when possible:

```rust
// Good: One mesh for 100 entities
let mesh = engine.add_resource(Mesh::new("Cube", "models/Cube.obj".into()))?;
let material = engine.add_resource::<Material>(Material::builder("Blue").build())?;

for i in 0..100 {
    engine.build_entity(scene)
        .with_component(TransformComponent::builder()
            .position(Vector3f::new(i as f32, 0.0, 0.0))
            .build())
        .with_component(MeshRenderingComponent::builder()
            .mesh(&mesh)      // Shared!
            .material(&material)  // Shared!
            .build())
        .build();
}
```

### Texture Resolution

Balance quality and performance:

- **UI elements**: 512x512 or smaller
- **Character textures**: 1024x1024 to 2048x2048
- **Environment**: 2048x2048 for close-up, 512x512 for distant
- **Skybox**: 2048x2048 or 4096x4096

### Loading Time

Consider async loading for large resources:

```rust
// For now, load everything in start()
// Future: Async resource loading system
```

## Next Steps

Now that you understand resources, continue to:

- [Next Steps](/guide_current/next-steps) - Build complete game features
- [Troubleshooting](/guide_current/troubleshooting) - Solve common issues
