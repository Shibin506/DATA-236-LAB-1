import React from 'react'

export default function AgentAIBubble({ onClick }) {
  return (
    <button aria-label="Agent AI" onClick={onClick}
      className="btn btn-brand text-white position-fixed" style={{right:20,bottom:20,borderRadius:24}}>
      Ask Agent AI
    </button>
  )
}
