import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import CatalogoProductos from "./pages/CatalogoProductos";
import CrearProducto from "./pages/CrearProducto";
import POS from "./pages/POS";
import Contabilidad from "./pages/Contabilidad";
import Marketing from "./pages/Marketing";
import Distribuidores from "./pages/Distribuidores";
import Inversiones from "./pages/Inversiones";
import { Menu } from "lucide-react";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        {/* Mobile Header Bar */}
        <div className="mobile-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              style={{ 
                background: "none", 
                border: "none", 
                color: "white", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center",
                padding: "8px",
                borderRadius: "5px"
              }}
            >
              <Menu size={24} />
            </button>
            <span style={{ fontWeight: "700", fontSize: "1.25rem", color: "white" }}>AdminVentas</span>
          </div>
        </div>

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="main-content">
          <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "700" }}>AdminVentas React</h1>
          </header>
          
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/catalogo" element={<CatalogoProductos />} />
              <Route path="/crear-producto" element={<CrearProducto />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/contabilidad" element={<Contabilidad />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/distribuidores" element={<Distribuidores />} />
              <Route path="/inversiones" element={<Inversiones />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
