import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import './i18n.js';

import App from './App.jsx';

import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />

    <Toaster position="top-right" reverseOrder={false} />
  </React.StrictMode>
);
