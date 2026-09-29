import Streamer from "./pages/Streamer.jsx";
import Viewer from "./pages/Viewer.jsx";

function App() {

  const path = window.location.pathname;

  if (path === "/stream") {
    return <Streamer />;
  }

  if (path === "/watch") {
    return <Viewer />;
  }

  return (

    <div style={{ textAlign: "center" }}>

      <h1>Video Streaming App</h1>

      <p>
        Open /stream for streamer
      </p>

      <p>
        Open /watch for viewer
      </p>

    </div>

  );

}

export default App;