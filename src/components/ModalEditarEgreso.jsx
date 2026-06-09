import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ModalEditarEgreso({ isOpen, onClose, egreso }) {
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState("Maquinaria y Equipo");
  const [monto, setMonto] = useState("");

  useEffect(() => {
    if (isOpen && egreso) {
      setConcepto(egreso.concepto || egreso.descripcion || "");
      setCategoria(egreso.categoria || "Maquinaria y Equipo");
      setMonto(egreso.costoTotal || "");
    }
  }, [isOpen, egreso]);

  if (!isOpen || !egreso) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const costo = parseFloat(monto);
      if (!costo || costo <= 0) return;

      await updateDoc(doc(db, "ventas", egreso.id), {
        concepto,
        categoria,
        costoTotal: costo
      });
      alert("¡Egreso actualizado!");
      onClose();
    } catch (error) {
      console.error("Error al actualizar egreso:", error);
      alert("Error al actualizar");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ width: "90%", maxWidth: "500px" }}>
        <h3 style={{ marginBottom: "20px" }}>Editar Egreso / Gasto</h3>
        <form onSubmit={handleUpdate} style={{ display: "grid", gap: "15px" }}>
          <div>
            <label>Concepto (Ej. Máquina de coser, Recibo de luz)</label>
            <input required value={concepto} onChange={e=>setConcepto(e.target.value)} />
          </div>
          
          <div>
            <label>Categoría</label>
            <select value={categoria} onChange={e=>setCategoria(e.target.value)}>
              <option value="Maquinaria y Equipo">Maquinaria y Equipo</option>
              <option value="Servicios (Luz, Agua, Internet)">Servicios (Luz, Agua, etc.)</option>
              <option value="Alquileres">Alquileres</option>
              <option value="Otros Gastos Operativos">Otros Gastos Operativos</option>
            </select>
          </div>

          <div>
            <label>Costo Total Pagado (S/)</label>
            <input type="number" step="0.01" required value={monto} onChange={e=>setMonto(e.target.value)} />
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
