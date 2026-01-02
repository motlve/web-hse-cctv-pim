import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ Import halaman
import LoginPage from "./pages/LoginPage";
import SummaryDashboard from "./pages/Summary";
import IncidentRecord from "./pages/IncidentRecord";
import CCTVPerformance from "./pages/CCTVPerformance";
import DataLocation from "./pages/DataLocation";
import Category from "./pages/Category";
import CCTVOfficers from "./pages/CCTVOfficers";
import SummaryRequestCamera from "./pages/SummaryRequestCam";
import ProfilePage from "./pages/Profile";
import CCTVId from "./pages/DataCCTV";
import ListCameraTrouble from "./pages/ListTroubleCamera";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ Default ke login */}
        <Route path="/" element={<LoginPage />} />

        {/* ✅ Auth routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* ✅ Main routes */}
        <Route path="/summary" element={<SummaryDashboard />} />
        <Route path="/incident-record" element={<IncidentRecord />} />
        <Route path="/cctv-performance" element={<CCTVPerformance />} />
        <Route path="/data-lokasi" element={<DataLocation />} />
        <Route path="/kategori" element={<Category />} />
        <Route path="/petugas" element={<CCTVOfficers />} />
        <Route path="/summary-request-camera" element={<SummaryRequestCamera />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/id-cctv" element={<CCTVId />} />
        <Route path="/list-camera-trouble" element={<ListCameraTrouble />} />
      </Routes>
    </Router>
  );
}

export default App;
