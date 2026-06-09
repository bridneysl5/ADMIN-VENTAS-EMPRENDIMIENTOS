import { useState } from "react";
import Insumos from "./Insumos";
import HistorialVentas from "./HistorialVentas";
import Egresos from "./Egresos";

export default function Contabilidad() {
  const [tab, setTab] = useState("historial");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button 
          className="btn-primary" 
          style={{ background: tab === "historial" ? "var(--primary)" : "rgba(255,255,255,0.1)", border: tab === "historial" ? "none" : "1px solid var(--glass-border)" }} 
          onClick={() => setTab("historial")}
        >
          Historial de Ventas
        </button>
        <button 
          className="btn-primary" 
          style={{ background: tab === "insumos" ? "var(--primary)" : "rgba(255,255,255,0.1)", border: tab === "insumos" ? "none" : "1px solid var(--glass-border)" }} 
          onClick={() => setTab("insumos")}
        >
          Insumos (Inventario)
        </button>
        <button 
          className="btn-primary" 
          style={{ background: tab === "egresos" ? "var(--primary)" : "rgba(255,255,255,0.1)", border: tab === "egresos" ? "none" : "1px solid var(--glass-border)" }} 
          onClick={() => setTab("egresos")}
        >
          Egresos y Gastos
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "historial" && <HistorialVentas />}
        {tab === "insumos" && <Insumos />}
        {tab === "egresos" && <Egresos />}
      </div>
    </div>
  );
}
