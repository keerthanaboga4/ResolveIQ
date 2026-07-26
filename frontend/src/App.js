import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import SubmitComplaint from "./pages/SubmitComplaint";
import AlertsPage from "./pages/AlertsPage";
import ChatBot from "./pages/ChatBot";
import About from "./pages/About";
import { LanguageProvider } from "./LanguageContext";
import "./App.css";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/submit" element={<SubmitComplaint />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/chat" element={<ChatBot />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;