import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-house-door me-2" viewBox="0 0 16 16" style={{color:'#ff385c'}}>
            <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5V14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7.5a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-1 0v2.293L8.354 1.146Z"/>
            <path d="M13 2.5v2.293l1.146 1.147A.5.5 0 0 1 14.5 6.5V14a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V6.5a.5.5 0 0 1 .146-.354L3 4.793V2.5a1.5 1.5 0 1 1 3 0V3h4v-.5a1.5 1.5 0 1 1 3 0Z"/>
          </svg>
          <span>airbnb</span>
        </Link>

        <div className="d-flex align-items-center ms-auto">
          <Link className="btn btn-outline-secondary me-2" to="/host">Switch to hosting</Link>
      {user ? (
            <div className="dropdown">
              <button className="btn btn-light dropdown-toggle" data-bs-toggle="dropdown">
                {user.name || user.email}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
        <li><Link className="dropdown-item" to="/trips">Trips</Link></li>
        <li><Link className="dropdown-item" to="/favorites">Favourites</Link></li>
                <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                {user.role === 'owner' && <li><Link className="dropdown-item" to="/host/dashboard">Host Dashboard</Link></li>}
                <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
              </ul>
            </div>
          ) : (
            <div>
              <Link className="btn btn-outline-dark me-2" to="/login">Log in</Link>
              <Link className="btn btn-brand text-white" to="/signup">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
