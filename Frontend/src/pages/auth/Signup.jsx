import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../services/api'

export default function Signup() {
  const [role, setRole] = useState('traveler')
  const [form, setForm] = useState({ name: '', email: '', password: '', location: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      // Backend expects a single register endpoint with `user_type`
      const payload = { ...form, user_type: role }
      await authApi.signup(payload)
      navigate('/login')
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h2 className="mb-3">Sign up</h2>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="btn-group mb-3" role="group">
          <input type="radio" className="btn-check" name="role" id="roleTraveler" autoComplete="off" checked={role==='traveler'} onChange={() => setRole('traveler')} />
          <label className="btn btn-outline-dark" htmlFor="roleTraveler">Traveler</label>
          <input type="radio" className="btn-check" name="role" id="roleOwner" autoComplete="off" checked={role==='owner'} onChange={() => setRole('owner')} />
          <label className="btn btn-outline-dark" htmlFor="roleOwner">Owner</label>
        </div>

        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input className="form-control" name="name" value={form.name} onChange={onChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" name="email" type="email" value={form.email} onChange={onChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input className="form-control" name="password" type="password" value={form.password} onChange={onChange} required />
          </div>
          {role === 'owner' && (
            <div className="mb-3">
              <label className="form-label">Location</label>
              <input className="form-control" name="location" value={form.location} onChange={onChange} placeholder="City, State" />
            </div>
          )}
          <button className="btn btn-brand text-white">Create account</button>
        </form>
        <p className="mt-3">Have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  )
}
