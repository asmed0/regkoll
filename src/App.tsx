import { useState } from 'react'
import './App.css'

function App() {
  const [plate, setPlate] = useState('')
  const [result, setResult] = useState<'owned' | 'not-owned' | null>(null)
  const [loading, setLoading] = useState(false)

  const checkPlate = async (value: string) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/check?plate=${value}`)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setPlate(value)
    if (value.length === 6) {
      checkPlate(value)
    } else {
      setResult(null)
    }
  }

  return (
    <div className="container">
      <h1 className="title">REGKOLL</h1>
      <p className="subtext">Kolla upp registreringsnummer snabbt och smidigt</p>
      <form className="plate-form" onSubmit={(e) => e.preventDefault()}>
        <div className="plate-wrapper">
          <span className="se-tag">S</span>
          <input
            className="plate-input"
            value={plate}
            onChange={handleChange}
            maxLength={6}
            placeholder="ABC123"
          />
        </div>
        {loading && <span className="loading">Kontrollerar...</span>}
      </form>
      {result && (
        <p className={`result ${result}`}>
          {result === 'owned'
            ? 'Fordonet ägs av Polismyndigheten.'
            : 'Fordonet ägs inte av Polismyndigheten.'}
        </p>
      )}
    </div>
  )
}

export default App
