import { Canvas } from '@react-three/fiber'
import { PointerLockControls, useGLTF } from '@react-three/drei'
import { Suspense, useState, useEffect } from 'react'
import './App.css'

function Room() {
  const { scene } = useGLTF('/room.gltf')
  return <primitive object={scene} />
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
      position={[1, 0.15, 0]} // In front of player's view
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
    </div>
  )
}

export default App