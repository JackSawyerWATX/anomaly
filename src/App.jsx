import React, { useEffect, useRef, useState } from 'react'
import Renderer from './lib/renderer'
import shaderSource from './shader.frag?raw'
import './style.css'

export default function App() {
  const canvasRef = useRef(null)
  const textareaRef = useRef(null)
  const rendererRef = useRef(null)
  const rafRef = useRef(null)
  const [error, setError] = useState('')
  const [
    editMode, 
    setEditMode
  ] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const renderer = new Renderer(canvas, dpr)
    rendererRef.current = renderer

    const handleResize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      if (renderer) {
        renderer.updateScale(dpr)
      }
    }

    // Setup renderer and handle window resize
    renderer.setup()
    renderer.init()
    try {
      renderer.updateShader(shaderSource)
    } catch (err) {
      setError(err.message)
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    // Handle mouse movement
    const handleMouseMove = (e) => {
      if (renderer) {
        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX - rect.left) * dpr
        const y = (e.clientY - rect.top) * dpr
        renderer.updateMouse(x, y)
      }
    }
    canvas.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    const loop = (now) => {
      if (renderer) {
        try {
          renderer.render(now)
        } catch (err) {
          console.error(err)
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handleEditorChange = (e) => {
    const newSource = e.target.value
    try {
      rendererRef.current?.updateShader(newSource)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleView = () => {
    setEditMode(prev => !prev)
  }

  return (
    <div className="app">
      <canvas 
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: editMode ? -1 : 0
        }}
      />
      <textarea
        ref={textareaRef}
        className="editor"
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="off"
        translate="no"
        onChange={handleEditorChange}
        defaultValue={shaderSource}
        style={{
          zIndex: editMode ? 1 : -1,
          opacity: editMode ? 1 : 0,
          pointerEvents: editMode ? 'auto' : 'none'
        }}
      />
      {error && <pre className="error">{error}</pre>}
      <div className="controls">
        <label>
          <input
            type="checkbox"
            checked={editMode}
            onChange={toggleView}
          />
          -- jonathan.fausset --
        </label>
      </div>
    </div>
  )
}