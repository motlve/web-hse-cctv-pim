import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CameraTrouble from './pages/ListTroubleCamera';
import IncidentRecord from './pages/IncidentRecord';
import Performance from './pages/CCTVPerformance';
import SummaryRequest from './pages/SummaryRequest';
import DataLocation from './pages/DataLocation'
import Category from './pages/Category'
import CCTVPerformance from "./pages/CCTVPerformance";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/camera-trouble" element={<CameraTrouble />} />
<Route path="/incident-record" element={<IncidentRecord />} />
<Route path="/performance" element={<Performance />} />
<Route path="/summary-request" element={<SummaryRequest />} />
<Route path="/data-lokasi" element={<DataLocation />} />
<Route path="/kategori" element={<Category />} />
<Route path="/cctv-performance" element={<CCTVPerformance />} />
      </Routes>
    </Router>
  );
}

export default App;
