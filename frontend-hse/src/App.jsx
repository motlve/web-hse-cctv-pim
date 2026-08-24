import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ComingSoon from './dashboard/pages/ComingSoon';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ComingSoon />} />

        <Route path="/login/hse" element={<ComingSoon />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
