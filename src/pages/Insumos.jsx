import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import ConfirmModal from "../components/ConfirmModal";
import ModalEditarInsumo from "../components/ModalEditarInsumo";
import { Trash2, Edit2 } from "lucide-react";

const FACTORES = {
  'Metro': { menor: 'Centímetros (cm)', factor: 100 },
  'Kilo': { menor: 'Gramos (g)', factor: 1000 },
  'Litro': { menor: 'Mililitros (ml)', factor: 1000 },
  'Unidad': { menor: 'Unidades (u)', factor: 1 }
};

export default function Insumos() {
  const [insumos, setInsumos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("Metro");
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState("");
  const [insumoToDelete, setInsumoToDelete] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [insumoToEdit, setInsumoToEdit] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "insumos"), (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      setInsumos(docs);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const cantMayor = parseFloat(cantidad);
    const costoTotal = parseFloat(costo);
    const factor = FACTORES[unidad].factor;
    const cantMenorTotal = cantMayor * factor;
    const costoMenor = costoTotal / cantMenorTotal;

    await addDoc(collection(db, "insumos"), {
      nombre, unidadMayor: unidad, cantMayor, costoTotal,
      unidadMenor: FACTORES[unidad].menor, factor,
      cantMenorTotal, costoMenor
    });
    
    await addDoc(collection(db, "ventas"), {
      tipo: "gasto", total: 0, costoTotal: costoTotal, fecha: new Date().toISOString()
    });

    setNombre(""); setCantidad(""); setCosto("");
  };

  const handleDelete = (insumo) => {
    setInsumoToDelete(insumo);
  };

  const confirmDelete = async () => {
    if (insumoToDelete) {
      await deleteDoc(doc(db, "insumos", insumoToDelete.id));
      setInsumoToDelete(null);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Gestión de Insumos</h2>
      <div className="glass" style={{ padding: "20px", marginBottom: "20px" }}>
        <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
          <div><label>Nombre</label><input required value={nombre} onChange={e=>setNombre(e.target.value)} /></div>
          <div><label>Unidad Mayor</label><select value={unidad} onChange={e=>setUnidad(e.target.value)}>
            {Object.keys(FACTORES).map(k => <option key={k} value={k}>{k}</option>)}
          </select></div>
          <div><label>Cantidad (Ej. 1)</label><input type="number" step="0.01" required value={cantidad} onChange={e=>setCantidad(e.target.value)} /></div>
          <div><label>Costo Total (S/)</label><input type="number" step="0.01" required value={costo} onChange={e=>setCosto(e.target.value)} /></div>
          <button type="submit" className="btn-primary">Registrar Compra</button>
        </form>
      </div>

      <div className="glass" style={{ padding: "20px" }}>
        <table className="data-table">
          <thead>
            <tr><th>Insumo</th><th>Compra</th><th>Costo</th><th>U. Menor</th><th>Costo/U. Menor</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {insumos.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No hay insumos registrados aún.</td></tr>
            )}
            {insumos.map(i => (
              <tr key={i.id}>
                <td><strong>{i.nombre}</strong></td>
                <td>{i.cantMayor} {i.unidadMayor}</td>
                <td>S/ {i.costoTotal.toFixed(2)}</td>
                <td>{i.unidadMenor}</td>
                <td style={{ color: "var(--accent)" }}>S/ {i.costoMenor.toFixed(4)}</td>
                <td style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => { setInsumoToEdit(i); setIsEditOpen(true); }} className="btn-primary" style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", padding: "8px" }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(i)} className="btn-primary" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "8px" }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal isOpen={!!insumoToDelete} onClose={() => setInsumoToDelete(null)} onConfirm={confirmDelete} title="Eliminar Insumo" message={`¿Estás seguro de eliminar ${insumoToDelete?.nombre}?`} />
      <ModalEditarInsumo isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} insumo={insumoToEdit} />
    </div>
  );
}
