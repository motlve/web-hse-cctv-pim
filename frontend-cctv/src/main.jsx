import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import './i18n.js';

import App from './App.jsx';

import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/cctv">
      <App />
    </BrowserRouter>

    <Toaster position="top-right" reverseOrder={false} />
  </React.StrictMode>
);
