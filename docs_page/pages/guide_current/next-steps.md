# Next Steps

Congratulations on learning the basics of Pill! Here are some directions to take your game development further.

## Building Game Features

### Player Movement and Controls

Implement responsive player controls:

```rust
fn player_movement_system(engine: &mut Engine) -> Result<()> {
    let dt = engine.get_global_component::<TimeComponent>()?.delta_time;
    let input = engine.get_global_component::<InputComponent>()?;
    
    for (_, transform, player) in engine.iterate_two_components_mut::<
        TransformComponent,
        PlayerController,
    >()? {
        let mut movement = Vector3f::zeros();
        
        // WASD movement
        if input.is_key_pressed(KeyCode::W) {
            movement.z -= 1.0;
        }
        if input.is_key_pressed(KeyCode::S) {
            movement.z += 1.0;
        }
        if input.is_key_pressed(KeyCode::A) {
            movement.x -= 1.0;
        }
        if input.is_key_pressed(KeyCode::D) {
            movement.x += 1.0;
        }
        
        // Normalize and apply speed
        if movement.magnitude() > 0.0 {
            movement = movement.normalize() * player.speed * dt;
            transform.position += movement;
        }
        
        // Mouse look
        let mouse_delta = input.mouse_delta();
        transform.rotation *= Quaternionf::from_euler_angles(
            -mouse_delta.y * 0.001,
            -mouse_delta.x * 0.001,
            0.0
        );
    }
    
    Ok(())
}
```

### Camera Systems

Create different camera types:

#### Follow Camera

```rust
fn follow_camera_system(engine: &mut Engine) -> Result<()> {
    // Get player position
    let player_pos = {
        let mut pos = Vector3f::zeros();
        for (_, transform, _) in engine.iterate_two_components::<
            TransformComponent,
            PlayerTag,
        >()? {
            pos = transform.position;
            break;
        }
        pos
    };
    
    // Update camera position
    for (_, camera_transform, _) in engine.iterate_two_components_mut::<
        TransformComponent,
        CameraComponent,
    >()? {
        let offset = Vector3f::new(0.0, 5.0, 10.0);
        let target = player_pos + offset;
        
        // Smooth lerp
        let alpha = 5.0 * engine.get_global_component::<TimeComponent>()?.delta_time;
        camera_transform.position = camera_transform.position.lerp(&target, alpha);
        
        // Look at player
        camera_transform.look_at(player_pos, Vector3f::y());
    }
    
    Ok(())
}
```

#### Orbit Camera

```rust
fn orbit_camera_system(engine: &mut Engine) -> Result<()> {
    let input = engine.get_global_component::<InputComponent>()?;
    
    for (_, transform, orbit) in engine.iterate_two_components_mut::<
        TransformComponent,
        OrbitCamera,
    >()? {
        // Mouse input for orbiting
        let mouse_delta = input.mouse_delta();
        orbit.yaw -= mouse_delta.x * 0.003;
        orbit.pitch -= mouse_delta.y * 0.003;
        orbit.pitch = orbit.pitch.clamp(-1.5, 1.5);
        
        // Mouse wheel for zoom
        orbit.distance -= input.mouse_wheel_delta() * 0.5;
        orbit.distance = orbit.distance.clamp(2.0, 50.0);
        
        // Calculate position
        let x = orbit.distance * orbit.pitch.cos() * orbit.yaw.sin();
        let y = orbit.distance * orbit.pitch.sin();
        let z = orbit.distance * orbit.pitch.cos() * orbit.yaw.cos();
        
        transform.position = orbit.target + Vector3f::new(x, y, z);
        transform.look_at(orbit.target, Vector3f::y());
    }
    
    Ok(())
}
```

### Physics Integration

Use physics for realistic gameplay:

```rust
// Create dynamic physics object
engine.build_entity(scene)
    .with_component(TransformComponent::builder()
        .position(Vector3f::new(0.0, 10.0, 0.0))
        .build())
    .with_component(MeshRenderingComponent::builder()
        .mesh(&mesh)
        .material(&material)
        .build())
    .with_component(RigidBodyComponent::builder()
        .body_type(RigidBodyType::Dynamic)
        .linear_damping(0.5)  // Air resistance
        .angular_damping(0.5)  // Rotation resistance
        .build())
    .with_component(ColliderComponent::builder()
        .shape(SharedShape::ball(1.0))
        .mass(10.0)
        .restitution(0.7)  // Bounciness
        .friction(0.5)
        .build())
    .build();
```

#### Applying Forces

```rust
fn apply_force_system(engine: &mut Engine) -> Result<()> {
    let input = engine.get_global_component::<InputComponent>()?;
    
    for (_, rigidbody, _) in engine.iterate_two_components_mut::<
        RigidBodyComponent,
        PlayerTag,
    >()? {
        if input.is_key_just_pressed(KeyCode::Space) {
            // Apply upward impulse
            rigidbody.apply_impulse(Vector3f::new(0.0, 500.0, 0.0));
        }
        
        if input.is_key_pressed(KeyCode::W) {
            // Apply forward force
            rigidbody.apply_force(Vector3f::new(0.0, 0.0, -100.0));
        }
    }
    
    Ok(())
}
```

### AI and Behavior

Implement simple AI systems:

```rust
define_component!(AIComponent {
    state: AIState,
    target: Option<EntityHandle>,
    patrol_points: Vec<Vector3f>,
    current_patrol: usize,
});

enum AIState {
    Idle,
    Patrol,
    Chase,
    Attack,
}

fn ai_system(engine: &mut Engine) -> Result<()> {
    let dt = engine.get_global_component::<TimeComponent>()?.delta_time;
    
    // Get player position
    let player_pos = get_player_position(engine)?;
    
    for (entity, transform, ai) in engine.iterate_two_components_mut::<
        TransformComponent,
        AIComponent,
    >()? {
        let distance_to_player = (player_pos - transform.position).magnitude();
        
        match ai.state {
            AIState::Patrol => {
                // Move to patrol point
                let target = ai.patrol_points[ai.current_patrol];
                move_towards(transform, target, 2.0 * dt);
                
                // Check if reached
                if (target - transform.position).magnitude() < 0.5 {
                    ai.current_patrol = (ai.current_patrol + 1) % ai.patrol_points.len();
                }
                
                // Check for player
                if distance_to_player < 10.0 {
                    ai.state = AIState::Chase;
                }
            }
            AIState::Chase => {
                // Chase player
                move_towards(transform, player_pos, 3.0 * dt);
                
                // Check if in attack range
                if distance_to_player < 2.0 {
                    ai.state = AIState::Attack;
                }
                // Check if lost player
                else if distance_to_player > 15.0 {
                    ai.state = AIState::Patrol;
                }
            }
            AIState::Attack => {
                // Attack logic
                look_at(transform, player_pos);
                
                if distance_to_player > 3.0 {
                    ai.state = AIState::Chase;
                }
            }
            _ => {}
        }
    }
    
    Ok(())
}
```

## Networking Multiplayer Games

### Setting Up Networking

Enable networking in your `Cargo.toml`:

```toml
[dependencies]
pill_engine = { path = "../Pill-Engine/engine/pill_engine", features = ["net"] }
```

### Client Setup

```rust
#[cfg(feature = "net")]
{
    use pill_engine::{NetState, NetworkStateComponent};
    use rand::Rng;
    
    // Create client instance
    let client_id = rand::thread_rng().gen_range(1..=10_000_000);
    let server_addr = "127.0.0.1:5000";
    
    engine.add_global_component(NetState::new_client(server_addr, client_id)?)?;
    
    // Add network component to player
    engine.add_component_to_entity(
        scene,
        player_entity,
        NetworkStateComponent {
            net_entity_id: rand::thread_rng().gen_range(1..=1000),
            owner_id: client_id,
            state: NetEntityState::Spawn,
            transform: Some(initial_transform.clone()),
        },
    )?;
}
```

### Server Setup

```rust
#[cfg(feature = "net")]
{
    let port = 5000;
    engine.add_global_component(NetState::new_server(port)?)?;
    
    // Add networking system
    engine.add_system("NetworkingServer", pill_engine::networking_system_server)?;
}
```

## Advanced Topics

### Custom Shaders

While Pill handles shaders internally, you can customize rendering:

```rust
// Future: Custom shader support
// Check res/shaders/ for built-in shaders
```

### Post-Processing Effects

Add screen-space effects:

```rust
// Future: Post-processing API
// Currently configured through renderer settings
```

### Scene Management

Switch between multiple scenes:

```rust
// Create multiple scenes
let menu_scene = engine.create_scene("Menu")?;
let game_scene = engine.create_scene("Game")?;
let pause_scene = engine.create_scene("Pause")?;

// Switch scenes
engine.set_active_scene(game_scene)?;

// Later...
fn pause_game(engine: &mut Engine) -> Result<()> {
    let pause_scene = engine.get_scene("Pause")?;
    engine.set_active_scene(pause_scene)?;
    Ok(())
}
```

### Save/Load System

Implement game state persistence:

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct SaveData {
    player_position: Vector3f,
    score: i32,
    level: i32,
    inventory: Vec<Item>,
}

fn save_game(engine: &Engine) -> Result<()> {
    let save_data = SaveData {
        player_position: get_player_position(engine)?,
        score: engine.get_global_component::<GameState>()?.score,
        level: engine.get_global_component::<GameState>()?.level,
        inventory: get_player_inventory(engine)?,
    };
    
    let json = serde_json::to_string_pretty(&save_data)?;
    std::fs::write("save.json", json)?;
    
    Ok(())
}

fn load_game(engine: &mut Engine) -> Result<()> {
    let json = std::fs::read_to_string("save.json")?;
    let save_data: SaveData = serde_json::from_str(&json)?;
    
    // Restore game state
    set_player_position(engine, save_data.player_position)?;
    engine.get_global_component_mut::<GameState>()?.score = save_data.score;
    // ... restore other data
    
    Ok(())
}
```

## Learning Resources

### Example Projects

Study the included examples:

- **Empty**: Starting template - minimal setup
- **Floating-Pills**: Basic rendering and entities
- **Trucks**: Physics, controls, and camera systems
- **Italian-Brainrot**: Advanced features showcase
- **Net-Minimal**: Networking basics

### Community and Support

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share projects
- **Examples**: Browse example projects for patterns

### Rust Game Development

Expand your knowledge:

- [Rust Book](https://doc.rust-lang.org/book/) - Learn Rust fundamentals
- [Game Development in Rust](https://arewegameyet.rs/) - Rust gamedev ecosystem
- [Rapier Physics](https://rapier.rs/) - Physics engine documentation

## Performance Optimization

### Profiling

Measure performance to find bottlenecks:

```rust
use std::time::Instant;

fn expensive_system(engine: &mut Engine) -> Result<()> {
    let start = Instant::now();
    
    // Your system logic
    
    let elapsed = start.elapsed();
    if elapsed.as_millis() > 16 {
        println!("Warning: System took {}ms", elapsed.as_millis());
    }
    
    Ok(())
}
```

### Optimization Tips

1. **Minimize entity iteration**: Only query what you need
2. **Cache lookups**: Store frequently accessed data
3. **Use spatial partitioning**: For collision detection and visibility
4. **Batch operations**: Group similar entities together
5. **LOD systems**: Use lower detail for distant objects

### Memory Management

```rust
// Remove entities when no longer needed
engine.destroy_entity(scene, entity_handle)?;

// Unload unused resources
engine.remove_resource::<Mesh>(&unused_mesh_handle)?;
```

## Debugging Tips

### Visual Debugging

Draw debug information:

```rust
fn debug_draw_system(engine: &mut Engine) -> Result<()> {
    // Future: Debug drawing API
    // For now, use temporary entities
    
    Ok(())
}
```

### Logging

Use Rust's logging:

```rust
use log::{info, warn, error, debug};

fn my_system(engine: &mut Engine) -> Result<()> {
    info!("System running");
    debug!("Entity count: {}", entity_count);
    warn!("Low health detected");
    error!("Critical error occurred");
    
    Ok(())
}
```

## What's Next?

You now have the knowledge to build complete games with Pill. Here are some project ideas:

### Beginner Projects

- **Collect the Pills**: Simple collection game
- **Physics Playground**: Experiment with physics
- **Walking Simulator**: Exploration game

### Intermediate Projects

- **Tower Defense**: Strategy and AI
- **Racing Game**: Vehicle physics and tracks
- **Platformer**: Jumping and obstacles

### Advanced Projects

- **Multiplayer Arena**: Networking and combat
- **Open World**: Large environments and streaming
- **Procedural Generation**: Dynamic content

Remember to check the [Troubleshooting](/guide_current/troubleshooting) page if you encounter any issues!
