import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AgentAIBubble from './components/AgentAIBubble'
import AgentAIModal from './components/AgentAIModal'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Home from './pages/traveler/Home'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Profile from './pages/traveler/Profile'
import Favorites from './pages/traveler/Favorites'
import Trips from './pages/traveler/Trips'
import PropertyDetails from './pages/traveler/PropertyDetails'

import HostDashboard from './pages/owner/HostDashboard'
import HostPropertyForm from './pages/owner/HostPropertyForm'

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function Shell() {
  const navigate = useNavigate()
  const [showAgent, setShowAgent] = React.useState(false)
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="container my-4 flex-fill">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
          <Route path="/trips" element={<PrivateRoute><Trips /></PrivateRoute>} />
          <Route path="/properties/:id" element={<PropertyDetails />} />

          <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
          <Route path="/host/dashboard" element={<PrivateRoute role="owner"><HostDashboard /></PrivateRoute>} />
          <Route path="/host/properties/new" element={<PrivateRoute role="owner"><HostPropertyForm /></PrivateRoute>} />
        </Routes>
      </div>
      <Footer />
      <AgentAIBubble onClick={() => setShowAgent(true)} />
      <AgentAIModal show={showAgent} onClose={() => setShowAgent(false)} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
