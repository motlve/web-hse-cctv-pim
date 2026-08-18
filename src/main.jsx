import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Landing page (company profile)
import LandingMain from './landing/main.jsx';

// Dashboard CCTV (semua route login, incident-record, dll ada di dalam sini)
import DashboardApp from './dashboard/App';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Landing page company profile jadi halaman awal */}
        <Route path="/" element={<LandingMain />} />

        {/* Semua route dashboard CCTV di-nest di bawah /dashboard */}
        <Route path="/dashboard/*" element={<DashboardApp />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
