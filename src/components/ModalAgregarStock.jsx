import { useState, useEffect } from "react";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

export default function ModalAgregarStock({ isOpen, onClose, insumo }) {
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && insumo) {
      // Pre-llenar con los valores del anterior stock
      setCantidad(insumo.cantMayor || "");
      setCosto(insumo.costoTotal || "");
    }
  }, [isOpen, insumo]);

  if (!isOpen || !insumo) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cantMayorNueva = parseFloat(cantidad);
      const costoTotalNuevo = parseFloat(costo);
      const factor = insumo.factor || 1;
      const cantMenorNueva = cantMayorNueva * factor;
      const costoMenorNuevo = costoTotalNuevo / cantMenorNueva;

      // Obtener lotes existentes con fallback para registros antiguos
      const lotesExistentes = insumo.lotes && Array.isArray(insumo.lotes) 
        ? insumo.lotes 
        : [{
            cantMayor: insumo.cantMayor || 0,
            costoTotal: insumo.costoTotal || 0,
            cantMenorTotal: insumo.cantMenorTotal || 0,
            costoMenor: insumo.costoMenor || 0,
            fecha: insumo.fecha || new Date().toISOString()
          }];

      const nuevoLote = {
        cantMayor: cantMayorNueva,
        costoTotal: costoTotalNuevo,
        cantMenorTotal: cantMenorNueva,
        costoMenor: costoMenorNuevo,
        fecha: new Date().toISOString()
      };

      const todosLotes = [...lotesExistentes, nuevoLote];

      // Calcular nuevos totales ponderados
      const totalCantMenor = todosLotes.reduce((sum, l) => sum + l.cantMenorTotal, 0);
      const totalCosto = todosLotes.reduce((sum, l) => sum + (l.cantMenorTotal * l.costoMenor), 0);
      const nuevoCostoMenorPromedio = totalCantMenor > 0 ? (totalCosto / totalCantMenor) : 0;
      const totalCantMayor = totalCantMenor / factor;

      // 1. Actualizar el insumo en Firebase con el nuevo lote
      await updateDoc(doc(db, "insumos", insumo.id), {
        lotes: todosLotes,
        cantMenorTotal: totalCantMenor,
        cantMayor: totalCantMayor,
        costoTotal: totalCosto,
        costoMenor: nuevoCostoMenorPromedio
      });

      // 2. Registrar automáticamente la compra en ventas (tipo gasto) para el Dashboard
      await addDoc(collection(db, "ventas"), {
        tipo: "gasto",
        total: 0,
        costoTotal: costoTotalNuevo,
        fecha: new Date().toISOString(),
        concepto: insumo.nombre,
        categoria: "Insumos y Materiales"
      });

      alert(`¡Stock agregado con éxito a: ${insumo.nombre}!`);
      onClose();
    } catch (error) {
      console.error("Error al agregar stock:", error);
      alert("Error al agregar stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ width: "90%", maxWidth: "450px" }}>
        <h3 style={{ marginBottom: "15px" }}>Agregar Stock a Insumo</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
          Insumo: <strong style={{ color: "white" }}>{insumo.nombre}</strong>
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
          <div>
            <label>Cantidad a Agregar ({insumo.unidadMayor})</label>
            <input 
              type="number" 
              step="0.01" 
              required 
              value={cantidad} 
              onChange={e => setCantidad(e.target.value)} 
              placeholder="Ej. 10"
            />
          </div>

          <div>
            <label>Costo de esta nueva compra (S/)</label>
            <input 
              type="number" 
              step="0.01" 
              required 
              value={costo} 
              onChange={e => setCosto(e.target.value)} 
              placeholder="Ej. 15.00"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary" 
              style={{ padding: "10px 20px" }}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: "10px 20px" }}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Agregar Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
