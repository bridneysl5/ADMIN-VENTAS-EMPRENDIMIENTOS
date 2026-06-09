import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const FACTORES = {
  'Metro': { menor: 'Centímetros (cm)', factor: 100 },
  'Kilo': { menor: 'Gramos (g)', factor: 1000 },
  'Litro': { menor: 'Mililitros (ml)', factor: 1000 },
  'Unidad': { menor: 'Unidades (u)', factor: 1 }
};

export default function ModalEditarInsumo({ isOpen, onClose, insumo }) {
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("Metro");
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState("");
  const [cantMenorTotal, setCantMenorTotal] = useState("");

  useEffect(() => {
    if (isOpen && insumo) {
      setNombre(insumo.nombre || "");
      setUnidad(insumo.unidadMayor || "Metro");
      setCantidad(insumo.cantMayor || "");
      setCosto(insumo.costoTotal || "");
      setCantMenorTotal(insumo.cantMenorTotal || "");
    }
  }, [isOpen, insumo]);

  if (!isOpen || !insumo) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const cantMayor = parseFloat(cantidad);
      const costoTotal = parseFloat(costo);
      const factor = FACTORES[unidad].factor;
      // We allow manually setting the stock
      const cMenorTotal = parseFloat(cantMenorTotal); 
      const costoMenor = costoTotal / (cantMayor * factor);

      await updateDoc(doc(db, "insumos", insumo.id), {
        nombre,
        unidadMayor: unidad,
        cantMayor,
        costoTotal,
        unidadMenor: FACTORES[unidad].menor,
        factor,
        cantMenorTotal: cMenorTotal,
        costoMenor
      });
      alert("¡Insumo actualizado!");
      onClose();
    } catch (error) {
      console.error("Error al actualizar insumo:", error);
      alert("Error al actualizar");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ width: "90%", maxWidth: "500px" }}>
        <h3 style={{ marginBottom: "20px" }}>Editar Insumo</h3>
        <form onSubmit={handleUpdate} style={{ display: "grid", gap: "15px" }}>
          <div>
            <label>Nombre del Insumo / Material</label>
            <input required value={nombre} onChange={e=>setNombre(e.target.value)} />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label>Unidad Mayor</label>
              <select value={unidad} onChange={e=>setUnidad(e.target.value)}>
                {Object.keys(FACTORES).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label>Cantidad Inicial Comprada</label>
              <input type="number" step="0.01" required value={cantidad} onChange={e=>setCantidad(e.target.value)} />
            </div>
          </div>

          <div>
            <label>Costo Total Pagado (S/)</label>
            <input type="number" step="0.01" required value={costo} onChange={e=>setCosto(e.target.value)} />
          </div>

          <div>
             <label>Stock Actual (en {FACTORES[unidad]?.menor})</label>
             <input type="number" step="0.01" required value={cantMenorTotal} onChange={e=>setCantMenorTotal(e.target.value)} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "10px 20px" }}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ padding: "10px 20px" }}>Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}
