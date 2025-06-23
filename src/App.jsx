import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, useGLTF } from '@react-three/drei'
import { Suspense, useState, useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import './App.css'

function Room() {
  const { scene } = useGLTF('/room.gltf')
  return <primitive object={scene} />
}

function FPSWeapon() {
  const { scene } = useGLTF('/deagle.gltf')
  const weaponRef = useRef()
  
  useFrame(({ camera }) => {
    if (weaponRef.current) {
      // Position weapon relative to camera (right hand position)
      const weaponPosition = new Vector3(0.2, -0.5, -0.55)
      weaponPosition.applyMatrix4(camera.matrixWorld)
      weaponRef.current.position.copy(weaponPosition)
      
      // Rotate weapon to match camera rotation
      weaponRef.current.rotation.copy(camera.rotation)
      weaponRef.current.rotateY(Math.PI * 0.51) // Slight angle for natural look
    }
  })
  
  return (
    <primitive 
      ref={weaponRef}
      object={scene.clone()} 
      scale={[0.5, 0.5, 0.5]} // Adjust scale as needed
    />
  )
}

function Enemy() {
  const { scene } = useGLTF('/enemy.gltf') // Update this path to your enemy file name
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    // Spawn after 2 seconds
    const spawnTimer = setTimeout(() => {
      setVisible(true)
    }, 2000)
    
    // Disappear after 3 more seconds (5 seconds total)
    const disappearTimer = setTimeout(() => {
      setVisible(false)
    }, 5000)
    
    return () => {
      clearTimeout(spawnTimer)
      clearTimeout(disappearTimer)
    }
  }, [])
  
  if (!visible) return null
  
  return (
    <primitive 
      object={scene} 
      position={[0, 0.2, -2]} // In front of player's view
      scale={[1, 1, 1]}
    />
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [-7.6, 0.7, 0], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <Suspense fallback={null}>
          <Room />
          <Enemy />
          <FPSWeapon />
        </Suspense>
        
        {/* Mouse look controls with horizontal limits */}
        <PointerLockControls 
          minAzimuthAngle={-Math.PI / 3}  // Left limit (~-60 degrees)
          maxAzimuthAngle={Math.PI / 3}   // Right limit (~60 degrees)
        />
      </Canvas>
      
      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontFamily: 'Arial',
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        Click to look around with mouse
      </div>

      {/* Crosshair overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '10px',
        height: '10px',
        marginLeft: '-5px',
        marginTop: '-5px',
        backgroundColor: 'white',
        borderRadius: '50%',
        zIndex: 101,
        pointerEvents: 'none'
      }} />
    </div>
  )
}

export default App
