import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import ConfirmModal from "../components/ConfirmModal";
import ModalEditarEgreso from "../components/ModalEditarEgreso";
import { Trash2, Edit2 } from "lucide-react";

export default function Egresos() {
  const [egresos, setEgresos] = useState([]);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Maquinaria y Equipo");
  
  const [egresoToDelete, setEgresoToDelete] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [egresoToEdit, setEgresoToEdit] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "ventas"), where("tipo", "==", "egreso"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setEgresos(docs);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const costo = parseFloat(monto);
    if (!costo || costo <= 0) return;

    await addDoc(collection(db, "ventas"), {
      tipo: "egreso",
      concepto,
      categoria,
      costoTotal: costo,
      total: 0,
      fecha: new Date().toISOString()
    });

    setConcepto(""); setMonto("");
  };

  const handleDelete = (egreso) => {
    setEgresoToDelete(egreso);
  };

  const confirmDelete = async () => {
    if (egresoToDelete) {
      await deleteDoc(doc(db, "ventas", egresoToDelete.id));
      setEgresoToDelete(null);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Registro de Egresos y Compras Especiales</h2>
      
      <div className="glass" style={{ padding: "20px", marginBottom: "20px" }}>
        <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
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
            <label>Costo Total (S/)</label>
            <input type="number" step="0.01" required value={monto} onChange={e=>setMonto(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary">Registrar Egreso</button>
        </form>
      </div>

      <div className="glass" style={{ padding: "20px" }}>
        <h3>Historial de Egresos / Gastos</h3>
        <table className="data-table" style={{ marginTop: "15px" }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {egresos.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No hay egresos registrados aún.</td></tr>
            )}
            {egresos.map(e => (
              <tr key={e.id}>
                <td>{new Date(e.fecha).toLocaleString()}</td>
                <td><strong>{e.concepto || e.descripcion || "Egreso"}</strong></td>
                <td>{e.categoria || "Material / Insumo"}</td>
                <td style={{ color: "var(--danger)", fontWeight: "bold" }}>S/ {e.costoTotal.toFixed(2)}</td>
                <td style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => { setEgresoToEdit(e); setIsEditOpen(true); }} className="btn-primary" style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", padding: "8px" }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(e)} className="btn-primary" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "8px" }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal isOpen={!!egresoToDelete} onClose={() => setEgresoToDelete(null)} onConfirm={confirmDelete} title="Eliminar Egreso" message={`¿Estás seguro de eliminar el registro de ${egresoToDelete?.concepto || "este egreso"}?`} />
      <ModalEditarEgreso isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} egreso={egresoToEdit} />
    </div>
  );
}
