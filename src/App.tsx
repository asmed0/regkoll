import { useState } from 'react'
import './App.css'

function App() {
  const [plate, setPlate] = useState('')
  const [result, setResult] = useState<'owned' | 'not-owned' | null>(null)
  const [loading, setLoading] = useState(false)

  const checkPlate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/check?plate=${plate}`)
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setResult(data.owned ? 'owned' : 'not-owned')
    } catch (err) {
      console.error(err)
      setResult('not-owned')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>RegKoll</h1>
      <form onSubmit={checkPlate} className="plate-form">
        <div className="plate-wrapper">
          <span className="se-tag">S</span>
          <input
            className="plate-input"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ABC123"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Kontrollerar...' : 'Sök'}
        </button>
      </form>
      {result && (
        <p className="result">
          {result === 'owned'
            ? 'Fordonet ägs av Polismyndigheten.'
            : 'Fordonet ägs inte av Polismyndigheten.'}
        </p>
      )}
    </div>
  )
}

export default App
