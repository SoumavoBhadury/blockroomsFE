import { Canvas } from '@react-three/fiber'
import { PointerLockControls, useGLTF } from '@react-three/drei'
import { Suspense } from 'react'
import './App.css'

function Room() {
  const { scene } = useGLTF('/room.gltf')
  return <primitive object={scene} />
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [-7.8, 0.7, 0], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <Suspense fallback={null}>
          <Room />
        </Suspense>
        
        {/* Mouse look controls */}
        <PointerLockControls />
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