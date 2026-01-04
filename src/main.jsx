import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GardenDetail from "./components/GardenDetail/GardenDetail.jsx";
import NewGarden from "./components/NewGarden/NewGarden.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/garden/:id" element={<GardenDetail />} />
         <Route path="/new-garden" element={<NewGarden />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
