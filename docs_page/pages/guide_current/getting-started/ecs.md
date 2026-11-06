# ECS (Entity Component System)

Pill is built around the Entity Component System (ECS) pattern, a powerful architectural approach for game development.

## What is ECS?

ECS separates data from behavior, organizing your game into three core concepts:

- **Entities**: Unique identifiers (IDs) that represent game objects
- **Components**: Pure data attached to entities
- **Systems**: Logic that operates on components

This separation provides better performance, modularity, and flexibility compared to traditional object-oriented approaches.

## Entities

Entities are lightweight identifiers that represent game objects. An entity by itself is just an ID - all functionality comes from the components attached to it.

### Creating Entities

Use the entity builder pattern:

```rust
let entity = engine.build_entity(scene)
    .with_component(TransformComponent::builder()
        .position(Vector3f::new(0.0, 0.0, 0.0))
        .build())
    .with_component(MeshRenderingComponent::builder()
        .mesh(&mesh_handle)
        .material(&material_handle)
        .build())
    .build();
```

### Entity Handle

The `build()` method returns an `EntityHandle` that you can store and use to reference the entity later:

```rust
let player_entity = engine.build_entity(scene)
    .with_component(TransformComponent::default())
    .build();

// Later, add more components
engine.add_component_to_entity(
    scene,
    player_entity,
    PlayerComponent { health: 100 }
)?;
```

## Components

Components are pure data structures that implement the `Component` trait. They represent different aspects of game objects.

### Built-in Components

Pill provides several built-in components:

#### TransformComponent

Position, rotation, and scale in 3D space:

```rust
TransformComponent::builder()
    .position(Vector3f::new(0.0, 5.0, 0.0))
    .rotation(Quaternionf::from_euler_angles(0.0, 45.0, 0.0))
    .scale(Vector3f::new(1.0, 1.0, 1.0))
    .build()
```

#### MeshRenderingComponent

Renders a 3D mesh with a material:

```rust
MeshRenderingComponent::builder()
    .mesh(&mesh_handle)
    .material(&material_handle)
    .build()
```

#### CameraComponent

Camera for rendering the scene:

```rust
CameraComponent::builder()
    .enabled(true)
    .fov(60.0)
    .near_plane(0.1)
    .far_plane(1000.0)
    .clear_color(Color::new(0.5, 0.7, 1.0))
    .build()
```

#### RigidBodyComponent

Physics simulation:

```rust
RigidBodyComponent::builder()
    .body_type(RigidBodyType::Dynamic)
    .build()
```

#### ColliderComponent

Collision detection:

```rust
ColliderComponent::builder()
    .shape(SharedShape::cuboid(1.0, 1.0, 1.0))
    .mass(10.0)
    .build()
```

#### AudioListenerComponent

Receives 3D audio (typically attached to camera):

```rust
AudioListenerComponent::builder()
    .enabled(true)
    .build()
```

#### AudioSourceComponent

Plays 3D audio from an entity:

```rust
AudioSourceComponent::builder()
    .audio_clip(&audio_handle)
    .volume(1.0)
    .looping(true)
    .build()
```

### Custom Components

Create your own components by implementing the `Component` trait:

```rust
use pill_engine::define_component;

// Simple data component
define_component!(HealthComponent {
    current: i32,
    max: i32,
});

// More complex component
pub struct PlayerController {
    pub speed: f32,
    pub jump_force: f32,
    pub grounded: bool,
}

impl PillTypeMapKey for PlayerController {
    type Storage = ComponentStorage<Self>;
}

impl Component for PlayerController {}
```

### Registering Components

Before using a component, register it with the scene:

```rust
engine.register_component::<TransformComponent>(scene)?;
engine.register_component::<MeshRenderingComponent>(scene)?;
engine.register_component::<PlayerController>(scene)?;
```

### Adding Components to Entities

Add components when building an entity:

```rust
engine.build_entity(scene)
    .with_component(TransformComponent::default())
    .with_component(PlayerController {
        speed: 5.0,
        jump_force: 10.0,
        grounded: false,
    })
    .build();
```

Or add them later:

```rust
engine.add_component_to_entity(
    scene,
    entity_handle,
    HealthComponent { current: 100, max: 100 }
)?;
```

## Systems

Systems contain the game logic that operates on entities with specific components. They run every frame in a defined order.

### Creating Systems

A system is a function that takes `&mut Engine` and returns `Result<()>`:

```rust
fn player_movement_system(engine: &mut Engine) -> Result<()> {
    let dt = engine.get_global_component::<TimeComponent>()?.delta_time;
    let input = engine.get_global_component::<InputComponent>()?;

    // Iterate over entities with both Transform and PlayerController
    for (_, transform, player) in engine.iterate_two_components_mut::<
        TransformComponent,
        PlayerController,
    >()? {
        // Handle movement input
        if input.is_key_pressed(KeyCode::W) {
            transform.position.z -= player.speed * dt;
        }
        if input.is_key_pressed(KeyCode::S) {
            transform.position.z += player.speed * dt;
        }
        
        // Handle jumping
        if input.is_key_just_pressed(KeyCode::Space) && player.grounded {
            // Apply jump force...
        }
    }

    Ok(())
}
```

### Registering Systems

Add systems during game initialization:

```rust
impl PillGame for Game {
    fn start(&self, engine: &mut Engine) -> Result<()> {
        // ... entity setup ...
        
        engine.add_system("PlayerMovement", player_movement_system)?;
        engine.add_system("EnemyAI", enemy_ai_system)?;
        
        Ok(())
    }
}
```

### System Execution Order

Systems execute in the order they were added. Plan your system order carefully:

```rust
// Input should be processed first
engine.add_system("InputSystem", input_system)?;

// Then game logic
engine.add_system("PlayerMovement", player_movement_system)?;
engine.add_system("EnemyAI", enemy_ai_system)?;

// Physics simulation
engine.add_system("Physics", physics_system)?;

// Rendering happens automatically after all systems
```

### Iterating Components

Pill provides several iteration methods:

#### Single Component

```rust
for (entity, transform) in engine.iterate_one_component::<TransformComponent>()? {
    // Process each entity with a transform
}
```

#### Two Components

```rust
for (entity, transform, mesh) in engine.iterate_two_components::<
    TransformComponent,
    MeshRenderingComponent,
>()? {
    // Process entities with both transform and mesh
}
```

#### Three Components

```rust
for (entity, transform, rigidbody, collider) in engine.iterate_three_components::<
    TransformComponent,
    RigidBodyComponent,
    ColliderComponent,
>()? {
    // Process entities with all three components
}
```

#### Mutable Iteration

Use `_mut` variants to modify components:

```rust
for (entity, transform, velocity) in engine.iterate_two_components_mut::<
    TransformComponent,
    VelocityComponent,
>()? {
    transform.position += velocity.value * dt;
}
```

## Global Components

Global components exist once per game, not attached to entities. They're useful for singleton-like data.

### Built-in Global Components

- **TimeComponent**: Delta time, total elapsed time
- **InputComponent**: Keyboard, mouse, and gamepad input
- **WindowComponent**: Window properties and events

### Using Global Components

```rust
fn my_system(engine: &mut Engine) -> Result<()> {
    // Read global component
    let time = engine.get_global_component::<TimeComponent>()?;
    let dt = time.delta_time;
    
    // Modify global component
    let mut input = engine.get_global_component_mut::<InputComponent>()?;
    // ... use input ...
    
    Ok(())
}
```

### Custom Global Components

```rust
pub struct GameState {
    pub score: i32,
    pub level: i32,
}

impl GlobalComponent for GameState {}
impl PillTypeMapKey for GameState {
    type Storage = GlobalComponentStorage<Self>;
}

// Add to engine
engine.add_global_component(GameState { score: 0, level: 1 })?;

// Use in systems
let mut state = engine.get_global_component_mut::<GameState>()?;
state.score += 10;
```

## Best Practices

### Component Design

1. **Keep components simple**: Store only data, no logic
2. **Prefer composition**: Combine small components rather than large ones
3. **Use builder patterns**: Make component creation ergonomic

```rust
// Good: Small, focused components
TransformComponent { position, rotation, scale }
VelocityComponent { value }
HealthComponent { current, max }

// Avoid: Monolithic components
GameObjectComponent { position, velocity, health, ... }
```

### System Design

1. **Single responsibility**: Each system should do one thing well
2. **Minimize coupling**: Systems shouldn't depend on each other directly
3. **Consider execution order**: Some systems must run before others

```rust
// Good: Focused systems
fn movement_system(engine: &mut Engine) -> Result<()> { /* ... */ }
fn collision_system(engine: &mut Engine) -> Result<()> { /* ... */ }
fn rendering_system(engine: &mut Engine) -> Result<()> { /* ... */ }

// Avoid: Everything in one system
fn game_system(engine: &mut Engine) -> Result<()> {
    // movement, collision, rendering, AI, etc...
}
```

### Performance Tips

1. **Query only what you need**: Don't iterate all entities if you only need a few components
2. **Cache frequently accessed data**: Store handles and references when appropriate
3. **Consider system order**: Minimize cache misses by grouping related operations

## Example: Complete Gameplay System

Here's a complete example combining entities, components, and systems:

```rust
// 1. Define custom components
define_component!(VelocityComponent {
    value: Vector3f,
});

define_component!(HealthComponent {
    current: i32,
    max: i32,
});

// 2. Implement game start
impl PillGame for Game {
    fn start(&self, engine: &mut Engine) -> Result<()> {
        let scene = engine.create_scene("Main")?;
        engine.set_active_scene(scene)?;
        
        // Register components
        engine.register_component::<TransformComponent>(scene)?;
        engine.register_component::<VelocityComponent>(scene)?;
        engine.register_component::<HealthComponent>(scene)?;
        
        // Create player entity
        engine.build_entity(scene)
            .with_component(TransformComponent::builder()
                .position(Vector3f::new(0.0, 1.0, 0.0))
                .build())
            .with_component(VelocityComponent {
                value: Vector3f::zeros()
            })
            .with_component(HealthComponent {
                current: 100,
                max: 100
            })
            .build();
        
        // Add systems
        engine.add_system("Movement", movement_system)?;
        engine.add_system("Health", health_system)?;
        
        Ok(())
    }
}

// 3. Implement systems
fn movement_system(engine: &mut Engine) -> Result<()> {
    let dt = engine.get_global_component::<TimeComponent>()?.delta_time;
    
    for (_, transform, velocity) in engine.iterate_two_components_mut::<
        TransformComponent,
        VelocityComponent,
    >()? {
        transform.position += velocity.value * dt;
    }
    
    Ok(())
}

fn health_system(engine: &mut Engine) -> Result<()> {
    for (entity, health) in engine.iterate_one_component_mut::<HealthComponent>()? {
        if health.current <= 0 {
            println!("Entity died!");
            // Handle death...
        }
    }
    
    Ok(())
}
```

## Next Steps

Now that you understand ECS, learn about:

- [Resources](/guide_current/getting-started/resources) - Managing meshes, textures, and materials
- [Next Steps](/guide_current/next-steps) - Building complete games
