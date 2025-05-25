import { useState } from "react";
import Layout from "../components/Layout";
import CameraOccupancy from "./CCTVPerformanceLayout/CameraOccupancy.jsx";
import RecordingDuration from "./CCTVPerformanceLayout/RecordDuration.jsx";
import ServicePerformance from "./CCTVPerformanceLayout/ServicePerformance.jsx"; 
import CameraNeeded from "./CCTVPerformanceLayout/CameraNeeded.jsx"; // import komponen baru

export default function CCTVPerformance() {
  const [selectedPage, setSelectedPage] = useState("occupancy");

  const renderPageContent = () => {
    if (selectedPage === "occupancy") {
      return <CameraOccupancy />;
    } else if (selectedPage === "recording") {
      return <RecordingDuration />;  
    } else if (selectedPage === "service") {
      return <ServicePerformance />;  
    } else if (selectedPage === "camera-needed") {
      return <CameraNeeded />;  
    } else {
      return (
        <div className="p-4 bg-white rounded-lg shadow">
          <p>Halaman tidak ditemukan.</p>
        </div>
      );
    }
  };

  return (
    <Layout>
      <div className="p-6 bg-white/30 backdrop-blur-md rounded-xl relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">CCTV Performance</h1>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="occupancy">Camera Occupancy</option>
            <option value="recording">Durasi Rekaman</option> 
            <option value="service">Service Performance</option>
            <option value="camera-needed">Camera Needed</option> {/* opsi baru */}
          </select>
        </div>

        {/* Konten halaman dinamis */}
        {renderPageContent()}
      </div>
    </Layout>
  );
}
