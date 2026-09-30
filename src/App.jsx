import Home from "./pages/Home.jsx";
import Streamer from "./pages/Streamer.jsx";
import Viewer from "./pages/Viewer.jsx";
import {BrowserRouter as Router,Routes,Route} from "react-router-dom"

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/streamer" element={<Streamer/>}/>
        <Route path="/viewer" element={<Viewer/>}/>
      </Routes>
    </Router>
  );

}

export default App;