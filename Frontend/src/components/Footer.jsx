import React from 'react'

export default function Footer() {
  return (
    <footer className="border-top bg-white mt-5 py-3">
      <div className="container d-flex justify-content-between">
        <span>© {new Date().getFullYear()} Airbnb Clone</span>
      </div>
    </footer>
  )
}
