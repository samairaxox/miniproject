import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import FocusMode from "./pages/FocusMode";

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/focus" element={<FocusMode />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;