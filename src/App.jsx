import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, useGLTF } from '@react-three/drei'
import { Suspense, useRef, useEffect, useState } from 'react'
import { Vector3, Raycaster, AudioListener, AudioLoader, Audio } from 'three'

function Room() {
  const { scene } = useGLTF('/room.gltf')
  return <primitive object={scene} />
}

function FPSWeapon({ onShoot }) {
  const { scene } = useGLTF('/deagle.gltf')
  const weaponRef = useRef()
  const { camera, gl } = useThree()
  const soundRef = useRef()

  useEffect(() => {
    const listener = new AudioListener()
    camera.add(listener)
    const sound = new Audio(listener)
    soundRef.current = sound
    new AudioLoader().load('/shoot.mp3', buffer => {
      sound.setBuffer(buffer)
      sound.setVolume(0.5)
    })
  }, [camera])

  useEffect(() => {
    const handleClick = () => {
      const { targets, canShoot, onEnemyHit, onFakeHit } = onShoot()
      if (!canShoot || !targets?.length) return

      if (soundRef.current?.isPlaying) soundRef.current.stop()
      soundRef.current?.play()

      const raycaster = new Raycaster()
      raycaster.setFromCamera({ x: 0, y: 0 }, camera)

      const intersects = raycaster.intersectObjects(
        targets.map(obj => obj.mesh),
        true
      )

      if (intersects.length > 0) {
        const hit = intersects[0].object
        const hitEnemy = targets.find(e => e.mesh === hit || hit.parent === e.mesh)
        if (hitEnemy) {
          hitEnemy.onHit()
          if (hitEnemy.isReal) {
            onEnemyHit?.()
          } else {
            onFakeHit?.()
          }
        }
      }
    }

    gl.domElement.addEventListener('click', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [onShoot, gl, camera])

  useFrame(() => {
    if (weaponRef.current) {
      const weaponPosition = new Vector3(0.2, -0.5, -0.55)
      weaponPosition.applyMatrix4(camera.matrixWorld)
      weaponRef.current.position.copy(weaponPosition)
      weaponRef.current.rotation.copy(camera.rotation)
      weaponRef.current.rotateY(Math.PI * 0.51)
    }
  })

  return (
    <primitive
      ref={weaponRef}
      object={scene.clone()}
      scale={[0.5, 0.5, 0.5]}
    />
  )
}

function EnemyGroup({ registerEnemies }) {
  const [visibleEnemies, setVisibleEnemies] = useState([])

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleEnemies(prev => [...prev, 0]), 1000),
      setTimeout(() => setVisibleEnemies(prev => [...prev, 1]), 2000),
      setTimeout(() => setVisibleEnemies(prev => [...prev, 2]), 3000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const allEnemies = [
    { position: [-5, 0.5, -3], rotation: [0, Math.PI / 4, 0] },
    { position: [-3, 0.5, -1], rotation: [0, Math.PI / 6, 0] },
    { position: [-4, 0.5, 2], rotation: [0, -Math.PI / 6, 0] },
  ]

  const enemyRefs = useRef([])
  const realEnemyIndex = useRef(Math.floor(Math.random() * 3)) // one random real

  useEffect(() => {
    registerEnemies(
      enemyRefs.current.map((ref, i) => ({
        mesh: ref,
        isReal: i === realEnemyIndex.current,
        onHit: () => {
          enemyRefs.current[i].visible = false
        },
      }))
    )
  }, [visibleEnemies.length])

  return (
    <>
      {visibleEnemies.map(i => {
        const { position, rotation } = allEnemies[i]
        return (
          <mesh
            key={i}
            ref={el => (enemyRefs.current[i] = el)}
            position={position}
            rotation={rotation}
            scale={[1, 1, 1]}
          >
            <capsuleGeometry args={[0.3, 1, 4, 8]} />
            <meshStandardMaterial color="red" />
          </mesh>
        )
      })}
    </>
  )
}

export default function App() {
  const enemiesRef = useRef([])
  const [ammo, setAmmo] = useState(6)
  const [popup, setPopup] = useState('')

 const showPopup = (text) => {

    setPopup(text)
    setTimeout(() => setPopup(''), 1500)
  }

  const handleShoot = () => {
    if (ammo <= 0) return { canShoot: false, targets: [] }

    setAmmo(ammo - 1)

    return {
      canShoot: true,
      targets: enemiesRef.current,
      onEnemyHit: () => {
        setAmmo(a => a + 1)
        showPopup('wagmi')
      },
      onFakeHit: () => {
        showPopup('goodluck wasting ammo!')
      },
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [-7.6, 0.7, 0], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <Suspense fallback={null}>
          <Room />
          <EnemyGroup registerEnemies={list => (enemiesRef.current = list)} />
          <FPSWeapon onShoot={handleShoot} />
        </Suspense>

        <PointerLockControls
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
        />
      </Canvas>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        background: 'rgba(0,0,0,0.4)',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'Arial',
        zIndex: 100,
      }}>
        Click to shoot • Find the real enemy
      </div>

      {/* Crosshair */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 10,
        height: 10,
        marginLeft: -5,
        marginTop: -5,
        backgroundColor: 'white',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 101,
      }} />

      {/* Ammo Display */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        color: 'white',
        fontSize: '20px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: '8px 14px',
        borderRadius: '6px',
        zIndex: 102,
      }}>
        {ammo} / 0
      </div>

      {/* Popup Message */}
      {popup && (
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '26px',
          color: 'white',
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.8)',
          padding: '12px 20px',
          borderRadius: '10px',
          zIndex: 103,
          fontFamily: 'monospace',
        }}>
          {popup}
        </div>
      )}
    </div>
  )
}
