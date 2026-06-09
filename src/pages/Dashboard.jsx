import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { PieChart, DollarSign, TrendingUp, ShoppingBag, Truck } from "lucide-react";

export default function Dashboard() {
  const [metricas, setMetricas] = useState({ 
    ingresos: 0, 
    costos: 0, 
    ganancia: 0,
    ventasPorEmprendimiento: {},
    gastosPorCategoria: {},
    ingresosDelivery: 0
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ventas"), (snapshot) => {
      let ingresos = 0;
      let costos = 0;
      let ingresosDelivery = 0;
      let ventasPorEmprendimiento = {
        "Regalos": 0,
        "Tortas": 0,
        "General": 0
      };
      let gastosPorCategoria = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        if(data.tipo === "ingreso") {
          ingresos += data.total;
          costos += data.costoTotal;
          
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
          // Gasto de insumos o egresos especiales
          costos += data.costoTotal;
          
          const cat = data.categoria || "Insumos y Materiales";
          if (!gastosPorCategoria[cat]) gastosPorCategoria[cat] = 0;
          gastosPorCategoria[cat] += data.costoTotal;
        }
      });
      
      setMetricas({ 
        ingresos, 
        costos, 
        ganancia: ingresos - costos,
        ventasPorEmprendimiento,
        gastosPorCategoria,
        ingresosDelivery
      });
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ height: "100%", overflowY: "auto", paddingBottom: "20px" }}>
      <h2 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <PieChart /> Dashboard Analítico
      </h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div className="glass" style={{ padding: "20px", borderLeft: "4px solid var(--accent)" }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
            <TrendingUp size={16} /> Ingresos Brutos Totales
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "var(--accent)", margin: "10px 0" }}>S/ {metricas.ingresos.toFixed(2)}</p>
        </div>
        
        <div className="glass" style={{ padding: "20px", borderLeft: "4px solid var(--danger)" }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
            <ShoppingBag size={16} /> Costos y Gastos Totales
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "var(--danger)", margin: "10px 0" }}>S/ {metricas.costos.toFixed(2)}</p>
        </div>
        
        <div className="glass" style={{ padding: "20px", borderLeft: "4px solid var(--primary)" }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
            <DollarSign size={16} /> Ganancia Neta Global
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "var(--primary)", margin: "10px 0" }}>S/ {metricas.ganancia.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        
        <div className="glass" style={{ padding: "20px" }}>
          <h3 style={{ marginBottom: "15px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>Ventas por Emprendimiento</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {Object.entries(metricas.ventasPorEmprendimiento).sort((a,b) => b[1] - a[1]).map(([emp, monto], idx) => (
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
            {Object.entries(metricas.gastosPorCategoria).sort((a,b) => b[1] - a[1]).map(([cat, monto], idx) => (
              <li key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "5px" }}>
                <span>{cat}</span>
                <strong style={{ color: "var(--danger)" }}>S/ {monto.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <Truck size={48} color="var(--primary)" style={{ marginBottom: "15px", opacity: 0.8 }} />
          <h3 style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "10px" }}>Ingresos por Delivery Cobrado</h3>
          <p style={{ fontSize: "36px", fontWeight: "bold", color: "var(--primary)", margin: 0 }}>S/ {metricas.ingresosDelivery.toFixed(2)}</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>Este monto está incluido en los Ingresos Totales.</p>
        </div>

      </div>
    </div>
  );
}
