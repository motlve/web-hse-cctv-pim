import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';

import IncidentRecord from './pages/IncidentRecord';
import DataLocation from './pages/DataLocation';
import Category from './pages/Category';
import CCTVOfficers from './pages/CCTVOfficers';

import SummaryRequestCamera from './pages/SummaryRequestCam';

import ProfilePage from './pages/Profile';

import CCTVId from './pages/DataCCTV';

import ListCameraTrouble from './pages/ListTroubleCamera';

import UserPage from './pages/User';

import CameraOccupancy from './pages/CameraOccupancy';

import DurationRecord from './pages/DurationRecord';

import ServicePerformance from './pages/ServicePerformance';

function DashboardApp() {
  return (
    <Routes>
      {/* DEFAULT CCTV LOGIN */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* CCTV MASTER */}
      <Route path="/id-cctv" element={<CCTVId />} />

      {/* FORM */}
      <Route path="/incident-record" element={<IncidentRecord />} />

      <Route path="/list-camera-trouble" element={<ListCameraTrouble />} />

      <Route path="/summary-request-camera" element={<SummaryRequestCamera />} />

      {/* PERFORMANCE */}
      <Route path="/camera-occupancy" element={<CameraOccupancy />} />

      <Route path="/recording-duration" element={<DurationRecord />} />

      <Route path="/service-performance" element={<ServicePerformance />} />

      {/* MASTER DATA */}
      <Route path="/data-lokasi" element={<DataLocation />} />

      <Route path="/kategori" element={<Category />} />

      <Route path="/petugas" element={<CCTVOfficers />} />

      <Route path="/user" element={<UserPage />} />

      {/* PROFILE */}
      <Route path="/profile" element={<ProfilePage />} />

      {/* ERROR PAGE */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default DashboardApp;
