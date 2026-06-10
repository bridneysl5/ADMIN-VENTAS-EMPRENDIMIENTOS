import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import ConfirmModal from "../components/ConfirmModal";
import ModalEditarInsumo from "../components/ModalEditarInsumo";
import ModalAgregarStock from "../components/ModalAgregarStock";
import { Trash2, Edit2, PlusCircle } from "lucide-react";

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
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [insumoToStock, setInsumoToStock] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const formatNombre = (str) => {
    if (!str) return "";
    let clean = str.trim();
    const lower = clean.toLowerCase();
    
    // Corregir errores comunes ortográficos específicos
    if (lower.startsWith("enase")) {
      clean = clean.replace(/enase/i, "Envase");
    }
    if (lower === "pringels") {
      clean = "Pringles";
    }
    if (lower === "pan hamburgusa") {
      clean = "Pan de Hamburguesa";
    }
    if (lower === "chantilli") {
      clean = "Chantilly";
    }

    return clean
      .split(' ')
      .filter(w => w.length > 0)
      .map(w => {
        const wLower = w.toLowerCase();
        if (wLower === "dtf") return "DTF";
        if (wLower === "ml") return "ml";
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(' ');
  };

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
    const nombreFormateado = formatNombre(nombre);

    const loteInicial = {
      cantMayor,
      costoTotal,
      cantMenorTotal,
      costoMenor,
      fecha: new Date().toISOString()
    };

    await addDoc(collection(db, "insumos"), {
      nombre: nombreFormateado, 
      unidadMayor: unidad, 
      cantMayor, 
      costoTotal,
      unidadMenor: FACTORES[unidad].menor, 
      factor,
      cantMenorTotal, 
      costoMenor,
      lotes: [loteInicial]
    });
    
    await addDoc(collection(db, "ventas"), {
      tipo: "gasto",
      total: 0,
      costoTotal: costoTotal,
      fecha: new Date().toISOString(),
      concepto: nombreFormateado,
      categoria: "Insumos y Materiales"
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

  const filteredInsumos = insumos
    .filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0 }}>Listado de Insumos</h3>
          <input 
            type="text" 
            placeholder="🔍 Buscar insumo por nombre..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "250px", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.1)", color: "white" }}
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Compra Inicial</th>
              <th>Stock Actual</th>
              <th>Costo Total</th>
              <th>Costo/U. Menor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInsumos.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No se encontraron insumos.</td></tr>
            )}
            {filteredInsumos.map(i => (
              <tr key={i.id}>
                <td><strong>{i.nombre}</strong></td>
                <td>{i.cantMayor} {i.unidadMayor}</td>
                <td>
                  <strong style={{ color: i.cantMenorTotal <= 0 ? "var(--danger)" : "var(--accent)" }}>
                    {i.cantMenorTotal}
                  </strong>{" "}
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{i.unidadMenor}</span>
                </td>
                <td>S/ {i.costoTotal.toFixed(2)}</td>
                <td style={{ color: "var(--accent)" }}>S/ {i.costoMenor.toFixed(4)}</td>
                <td style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button onClick={() => { setInsumoToStock(i); setIsStockOpen(true); }} className="btn-primary" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--accent)", padding: "6px 10px", fontSize: "0.85rem", gap: "4px" }} title="Agregar Stock">
                    <PlusCircle size={14} /> + Stock
                  </button>
                  <button onClick={() => { setInsumoToEdit(i); setIsEditOpen(true); }} className="btn-primary" style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", padding: "8px" }} title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(i)} className="btn-primary" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "8px" }} title="Eliminar">
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
      <ModalAgregarStock isOpen={isStockOpen} onClose={() => setIsStockOpen(false)} insumo={insumoToStock} />
    </div>
  );
}
