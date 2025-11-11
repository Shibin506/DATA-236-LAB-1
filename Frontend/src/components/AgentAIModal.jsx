import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { agentApi } from '../services/api'

export default function AgentAIModal({ show, onClose }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  if (!show) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const payload = {
        booking_context: {},
        preferences: {},
        local_context: {},
        nlu_prompt: prompt.trim()
      }
      const { data } = await agentApi.conciergeAgent(payload)
      setResult(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to get agent response')
    } finally {
      setLoading(false)
    }
  }

  const CloseOnBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100" style={{background:'rgba(0,0,0,0.35)', zIndex:1060}} onClick={CloseOnBackdrop}>
      <div className="container h-100 d-flex align-items-end align-items-md-center">
        <div className="card shadow w-100" style={{maxWidth:800, margin:'0 auto', maxHeight:'85vh', display:'flex', flexDirection:'column'}}>
          <div className="card-header d-flex justify-content-between align-items-center flex-shrink-0">
            <strong>Agent AI Concierge</strong>
            <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>&times;</button>
          </div>
          <div className="card-body" style={{overflowY:'auto'}}>
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Ask anything about your trip</label>
                <textarea className="form-control" rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g., 2-day family trip ideas near San Jose; vegan-friendly; stroller and wheelchair accessible" />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-brand text-white" disabled={loading || !prompt.trim()}>
                  {loading ? 'Thinking…' : 'Ask'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Close</button>
              </div>
            </form>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {result && (
              <div className="mt-4">
                {Array.isArray(result.day_by_day_plan) && (
                  <div className="mb-3">
                    <h6>Day-by-day plan</h6>
                    <ul>
                      {result.day_by_day_plan.map((d, idx) => (
                        <li key={idx}><strong>Day {d.day}:</strong> {d.title} — {(d.highlights||[]).join(', ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(result.properties) && (
                  <div className="mb-3">
                    <h6>Properties in location</h6>
                    <ul>
                      {result.properties.map((p, idx) => (
                        <li key={idx}>
                          <strong>{p.id ? (
                            <Link to={`/properties/${p.id}`} className="text-decoration-none">{p.name}</Link>
                          ) : p.name}</strong> — ${p.price_per_night} night
                          {p.city && (<span className="text-muted"> ({[p.city,p.state,p.country].filter(Boolean).join(', ')})</span>)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {typeof result.properties === 'string' && result.properties === 'no property' && (
                  <div className="mb-3">
                    <h6>Properties in location</h6>
                    <p className="text-muted">No property listed for this location.</p>
                  </div>
                )}
                {Array.isArray(result.activity_cards) && (
                  <div className="mb-3">
                    <h6>Activities</h6>
                    <ul>
                      {result.activity_cards.map((a, idx) => {
                        const label = a.name || a.title || a.type
                        const link = a.link || a.url
                        return (
                          <li key={idx}>
                            <strong>
                              {link ? (
                                <a href={link} target="_blank" rel="noreferrer">{label}</a>
                              ) : (
                                label
                              )}
                            </strong>
                            {`: ${a.duration || ''} ${(a.suits||[]).join(', ')}`}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                {Array.isArray(result.restaurant_recommendations) && (
                  <div className="mb-3">
                    <h6>Restaurants</h6>
                    <ul>
                      {result.restaurant_recommendations.map((r, idx) => {
                        const link = r.link || r.url
                        return (
                          <li key={idx}>
                            <strong>
                              {link ? (
                                <a href={link} target="_blank" rel="noreferrer">{r.name}</a>
                              ) : (
                                r.name
                              )}
                            </strong>
                            {` — ${r.cuisine || ''} ${r.notes ? `(${r.notes})` : ''}`}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                {Array.isArray(result.packing_checklist) && (
                  <div className="mb-2">
                    <h6>Packing checklist</h6>
                    <ul>
                      {result.packing_checklist.map((p, idx) => (
                        <li key={idx}><strong>{p.item}:</strong> {p.why}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
