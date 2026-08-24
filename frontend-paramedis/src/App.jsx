import { BrowserRouter } from 'react-router-dom';

import ComingSoon from './dashboard/pages/ComingSoon';

function App() {
  return (
    <BrowserRouter basename="/login/paramedis">
      <ComingSoon />
    </BrowserRouter>
  );
}

export default App;
