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
      const { targets, canShoot, onRealHit, onFakeHit, gameOver } = onShoot()
      if (!canShoot) {
        gameOver?.()
        return
      }

      if (soundRef.current?.isPlaying) soundRef.current.stop()
      soundRef.current?.play()

      const raycaster = new Raycaster()
      raycaster.setFromCamera({ x: 0, y: 0 }, camera)

      const intersects = raycaster.intersectObjects(targets.map(e => e.mesh), true)

      if (intersects.length > 0) {
        const hit = intersects[0].object
        const hitEnemy = targets.find(e => e.mesh === hit || hit.parent === e.mesh)
        if (hitEnemy) {
          hitEnemy.onHit()
          if (hitEnemy.isReal) {
            onRealHit?.()
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

function EnemyGroup({ enemySet, registerEnemies }) {
  const enemyRefs = useRef([])

  useEffect(() => {
    registerEnemies(
      enemyRefs.current.map((ref, i) => ({
        mesh: ref,
        isReal: enemySet[i].isReal,
        onHit: () => {
          if (ref) ref.visible = false
        },
      }))
    )
  }, [enemySet])

  return (
    <>
      {enemySet.map((enemy, i) => (
        <mesh
          key={i}
          ref={el => (enemyRefs.current[i] = el)}
          position={enemy.position}
          rotation={[0, enemy.rotationY, 0]}
          scale={[1, 1, 1]}
        >
          <capsuleGeometry args={[0.3, 1, 4, 8]} />
          <meshStandardMaterial color="red" />
        </mesh>
      ))}
    </>
  )
}

function getRandomEnemySet(remainingEnemies) {
  const nextSet = remainingEnemies.slice(0, 3)
  const rest = remainingEnemies.slice(3)
  return [nextSet, rest]
}

export default function App() {
  const enemiesRef = useRef([])
  const [ammo, setAmmo] = useState(6)
  const [popup, setPopup] = useState('')
  const [enemyPool, setEnemyPool] = useState([])
  const [currentSet, setCurrentSet] = useState([])
  const [gameEnded, setGameEnded] = useState(false)

  useEffect(() => {
    // Generate 48 enemies (16 real + 32 fake), randomize order
    const enemies = []
    for (let i = 0; i < 48; i++) {
      enemies.push({
        isReal: i < 16,
        position: [
          -5 + Math.random() * 4,
          0.5,
          -3 + Math.random() * 6,
        ],
        rotationY: Math.random() * Math.PI * 2,
      })
    }

    // Shuffle
    for (let i = enemies.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[enemies[i], enemies[j]] = [enemies[j], enemies[i]]
    }

    const [initialSet, rest] = getRandomEnemySet(enemies)
    setCurrentSet(initialSet)
    setEnemyPool(rest)
  }, [])

  const showPopup = (text) => {
    setPopup(text)
    setTimeout(() => setPopup(''), 1500)
  }

  const handleShoot = () => {
    if (gameEnded || ammo <= 0) {
      return { canShoot: false, targets: [], gameOver: () => showPopup('Game Over') }
    }

    setAmmo(a => a - 1)

    return {
      canShoot: true,
      targets: enemiesRef.current,
      onRealHit: () => {
        showPopup('wagmi')
        // Despawn current and spawn next set
        const [nextSet, rest] = getRandomEnemySet(enemyPool)
        setCurrentSet(nextSet)
        setEnemyPool(rest)
      },
      onFakeHit: () => {
        showPopup('goodluck wasting ammo!')
      },
      gameOver: () => showPopup('Game Over')
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [-7.6, 0.7, 0], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <Suspense fallback={null}>
          <Room />
          {currentSet.length > 0 && (
            <EnemyGroup enemySet={currentSet} registerEnemies={list => (enemiesRef.current = list)} />
          )}
          <FPSWeapon onShoot={handleShoot} />
        </Suspense>

        <PointerLockControls
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
        />
      </Canvas>

      {/* HUD */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
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

      {/* Popup */}
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
