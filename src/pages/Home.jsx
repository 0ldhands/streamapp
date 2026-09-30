import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div style={{ textAlign: "center" }}>

        <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/streamer">Stream</Link></li>
            <li><Link to="/viewer">Viewer</Link></li>
        </ul>

      <h1>Video Streaming App</h1>

      <p>
        Open /stream for streamer
      </p>

      <p>
        Open /watch for viewer
      </p>

    </div>

  )
}

export default Home