import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GardenDetail from "./components/GardenDetail/GardenDetail.jsx";
import NewGarden from "./components/NewGarden/NewGarden.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";
import { GardensProvider } from "./context/GardensContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <WorkspaceProvider>
        <GardensProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/garden/:id" element={<GardenDetail />} />
            <Route path="/new-garden" element={<NewGarden />} />
          </Routes>
        </GardensProvider>
      </WorkspaceProvider>
    </BrowserRouter>
  </React.StrictMode>
);
