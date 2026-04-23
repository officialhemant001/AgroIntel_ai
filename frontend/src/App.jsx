import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Scan from "./pages/Scan";
import Report from "./pages/Report";
import Settings from "./pages/Settings";
import Treatment from "./pages/Treatment";
import PestDetection from "./pages/PestDetection";
import CropHealth from "./pages/CropHealth";
import ChatAssistant from "./pages/ChatAssistant";

import AuthGuard from "./components/AuthGuard";
import LanguageProvider from "./context/LanguageContext";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/scan" element={<AuthGuard><Scan /></AuthGuard>} />
          <Route path="/report" element={<AuthGuard><Report /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/treatment" element={<AuthGuard><Treatment /></AuthGuard>} />
          <Route path="/pest" element={<AuthGuard><PestDetection /></AuthGuard>} />
          <Route path="/health" element={<AuthGuard><CropHealth /></AuthGuard>} />
          <Route path="/chat" element={<AuthGuard><ChatAssistant /></AuthGuard>} />

          {/* 404 Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;