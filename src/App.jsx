import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import CatalogoProductos from "./pages/CatalogoProductos";
import CrearProducto from "./pages/CrearProducto";
import POS from "./pages/POS";
import Contabilidad from "./pages/Contabilidad";

function App() {
  return (
    <Router>
      <div style={{ display: "flex", height: "100vh", background: "var(--bg-color)" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto", display: "flex", flexDirection: "column" }}>
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
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
