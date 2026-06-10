import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { PieChart, DollarSign, TrendingUp, ShoppingBag, Truck, Calendar } from "lucide-react";

export default function Dashboard() {
  const [ventasRaw, setVentasRaw] = useState([]);
  const [insumosRaw, setInsumosRaw] = useState([]);
  const [periodo, setPeriodo] = useState("Mes"); // Default to "Mes" as the initial view
  const [limiteGastos, setLimiteGastos] = useState(10);

  useEffect(() => {
    setLimiteGastos(10);
  }, [periodo]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ventas"), (snapshot) => {
      const docs = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setVentasRaw(docs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubInsumos = onSnapshot(collection(db, "insumos"), (snapshot) => {
      const docs = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setInsumosRaw(docs);
    });
    return () => unsubInsumos();
  }, []);

  const isWithinPeriod = (fechaISO, p) => {
    if (!fechaISO) return false;
    const date = new Date(fechaISO);
    const now = new Date();
    
    // Boundaries in local time
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const last7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (p === "Hoy") {
      return date >= today;
    } else if (p === "Ayer") {
      return date >= yesterday && date < today;
    } else if (p === "Semana") {
      return date >= last7Days;
    } else if (p === "Mes") {
      return date >= startOfMonth;
    }
    return true; // "Todo"
  };

  const transaccionesFiltradas = ventasRaw.filter(t => isWithinPeriod(t.fecha, periodo));

  let ingresos = 0;
  let costos = 0;
  let ingresosDelivery = 0;
  let ventasPorEmprendimiento = {
    "Regalos": 0,
    "Tortas": 0,
    "General": 0
  };
  let gastosPorCategoria = {};
  let listaGastosDetalle = [];

  transaccionesFiltradas.forEach((data) => {
    if (data.tipo === "ingreso") {
      ingresos += data.total;
      
      if (data.detalles?.incluyeDelivery && data.detalles?.costoDelivery) {
        ingresosDelivery += data.detalles.costoDelivery;
      }

      // Desglose por emprendimiento basado en items
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach(item => {
          const emp = item.emprendimiento || "General";
          const ventaItem = item.precioVenta * item.qty;
          if (!ventasPorEmprendimiento[emp]) ventasPorEmprendimiento[emp] = 0;
          ventasPorEmprendimiento[emp] += ventaItem;
        });
      }
    } else if (data.tipo === "egreso" || data.tipo === "gasto") {
      costos += data.costoTotal;
      
      const cat = data.categoria || "Insumos y Materiales";
      if (!gastosPorCategoria[cat]) gastosPorCategoria[cat] = 0;
      gastosPorCategoria[cat] += data.costoTotal;

      listaGastosDetalle.push({
        id: data.id,
        fecha: data.fecha,
        concepto: data.concepto || data.descripcion || (data.tipo === "gasto" ? "Compra de Insumo/Material" : "Egreso"),
        categoria: cat,
        monto: data.costoTotal
      });
    }
  });

  // Ordenar los gastos del periodo por fecha descendente
  listaGastosDetalle.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const ganancia = ingresos - costos;

  const insumosAlertas = insumosRaw.map(i => {
    const factor = i.factor || 1;
    const stockMaximoCritico = 2 * factor;
    const stockActual = i.cantMenorTotal || 0;
    const stockMayorActual = i.cantMayor || (stockActual / factor);
    
    let estado = "ok";
    if (stockActual <= 0) {
      estado = "agotado";
    } else if (stockActual <= stockMaximoCritico) {
      estado = "bajo";
    }
    
    return {
      ...i,
      stockActual,
      stockMayorActual,
      estado
    };
  }).filter(i => i.estado !== "ok");

  const listaGastosMostrados = listaGastosDetalle.slice(0, limiteGastos);

  return (
    <div style={{ height: "100%", overflowY: "auto", paddingBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <PieChart /> Dashboard Analítico
        </h2>
        
        <div className="glass" style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px", borderRadius: "8px" }}>
          <Calendar size={16} style={{ marginLeft: "8px", marginRight: "3px", opacity: 0.7 }} />
          {["Hoy", "Ayer", "Semana", "Mes", "Todo"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              style={{
                background: periodo === p ? "var(--primary)" : "transparent",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: periodo === p ? "bold" : "normal",
                transition: "all 0.2s"
              }}
            >
              {p === "Semana" ? "Últimos 7 días" : p === "Mes" ? "Este Mes" : p === "Todo" ? "Todo" : p}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div className="glass" style={{ padding: "20px", borderLeft: "4px solid var(--accent)" }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
            <TrendingUp size={16} /> Ingresos del Período
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "var(--accent)", margin: "10px 0" }}>S/ {ingresos.toFixed(2)}</p>
        </div>
        
        <div className="glass" style={{ padding: "20px", borderLeft: "4px solid var(--danger)" }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
            <ShoppingBag size={16} /> Costos y Gastos del Período
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "var(--danger)", margin: "10px 0" }}>S/ {costos.toFixed(2)}</p>
        </div>
        
        <div className="glass" style={{ padding: "20px", borderLeft: "4px solid var(--primary)" }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
            <DollarSign size={16} /> Ganancia Neta del Período
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "var(--primary)", margin: "10px 0" }}>S/ {ganancia.toFixed(2)}</p>
        </div>
      </div>

      {/* Alertas de Inventario Crítico */}
      {insumosAlertas.length > 0 && (
        <div className="glass" style={{ padding: "20px", borderLeft: "4px solid var(--danger)", marginBottom: "30px" }}>
          <h3 style={{ color: "var(--danger)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
            ⚠️ Alertas de Inventario Crítico ({insumosAlertas.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {insumosAlertas.map(i => (
              <div 
                key={i.id} 
                style={{ 
                  background: i.estado === "agotado" ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)",
                  border: i.estado === "agotado" ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)",
                  padding: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem" }}>{i.nombre}</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {i.estado === "agotado" ? "Agotado / Sin stock" : `Quedan: ${i.cantMenorTotal} ${i.unidadMenor}`}
                  </span>
                </div>
                <span style={{
                  background: i.estado === "agotado" ? "var(--danger)" : "#f59e0b",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "bold"
                }}>
                  {i.estado === "agotado" ? "Agotado" : "Bajo"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        
        <div className="glass" style={{ padding: "20px" }}>
          <h3 style={{ marginBottom: "15px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>Ventas por Emprendimiento</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {Object.entries(ventasPorEmprendimiento).sort((a,b) => b[1] - a[1]).map(([emp, monto], idx) => (
              <li key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "5px" }}>
                <span>{emp === "General" ? "Otros / Sin Asignar" : emp}</span>
                <strong style={{ color: "var(--accent)" }}>S/ {monto.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass" style={{ padding: "20px" }}>
          <h3 style={{ marginBottom: "15px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>Desglose de Gastos</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {Object.entries(gastosPorCategoria).sort((a,b) => b[1] - a[1]).map(([cat, monto], idx) => (
              <li key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "5px" }}>
                <span>{cat}</span>
                <strong style={{ color: "var(--danger)" }}>S/ {monto.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <Truck size={48} color="var(--primary)" style={{ marginBottom: "15px", opacity: 0.8 }} />
          <h3 style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "10px" }}>Delivery del Período</h3>
          <p style={{ fontSize: "36px", fontWeight: "bold", color: "var(--primary)", margin: 0 }}>S/ {ingresosDelivery.toFixed(2)}</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>Este monto está incluido en los Ingresos del Período.</p>
        </div>

      </div>

      {/* Detalle de Gastos */}
      <div className="glass" style={{ padding: "20px", marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0 }}>
            Gastos Detallados del Período ({periodo === "Semana" ? "Últimos 7 días" : periodo === "Mes" ? "Este Mes" : periodo})
          </h3>
          {listaGastosDetalle.length > 0 && (
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Mostrando {listaGastosMostrados.length} de {listaGastosDetalle.length}
            </span>
          )}
        </div>
        {listaGastosDetalle.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>No se registraron gastos en este período.</p>
        ) : (
          <div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--glass-border)" }}>
                    <th style={{ textAlign: "left", padding: "12px 10px" }}>Fecha y Hora</th>
                    <th style={{ textAlign: "left", padding: "12px 10px" }}>Nombre / Concepto</th>
                    <th style={{ textAlign: "left", padding: "12px 10px" }}>Categoría</th>
                    <th style={{ textAlign: "right", padding: "12px 10px" }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {listaGastosMostrados.map((gasto) => (
                    <tr key={gasto.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                      <td style={{ padding: "12px 10px", fontSize: "0.9rem" }}>{new Date(gasto.fecha).toLocaleString()}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <strong>{gasto.concepto}</strong>
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: "0.9rem", color: "var(--text-muted)" }}>{gasto.categoria}</td>
                      <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "bold", color: "var(--danger)" }}>
                        S/ {gasto.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {listaGastosDetalle.length > limiteGastos && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                <button
                  onClick={() => setLimiteGastos(prev => prev + 10)}
                  className="btn-primary"
                  style={{
                    padding: "10px 24px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    borderRadius: "8px",
                    background: "var(--primary)",
                    border: "none",
                    color: "white",
                    fontWeight: "bold",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    transition: "all 0.2s"
                  }}
                >
                  Mostrar más (+10)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
