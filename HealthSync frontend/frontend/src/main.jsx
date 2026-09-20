import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
axios.defaults.baseURL = isLocal ? "" : (import.meta.env.VITE_API_BASE_URL || "https://healthsync-gateway.onrender.com");

import App from "./App.jsx";
import "./App.css";
import { ToastProvider } from "./components/ToastProvider.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";

const savedTheme = localStorage.getItem("healthsync-theme") || "light";
document.documentElement.dataset.theme = savedTheme;
document.body.classList.toggle("healthsync-dark", savedTheme === "dark");

const token = localStorage.getItem("token");
if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;

ReactDOM.createRoot(document.getElementById("root")).render(
  
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider><ToastProvider><App /></ToastProvider></LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);

