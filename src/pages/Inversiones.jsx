import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Trash2 } from "lucide-react";

export default function Inversiones() {
  const [inversiones, setInversiones] = useState([]);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [comentarios, setComentarios] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inversiones"), (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      setInversiones(docs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    });
    return () => unsub();
  }, []);

  const handleAddInversion = async (e) => {
    e.preventDefault();
    if (!nombre || !monto || !fecha) return alert("Llena los campos requeridos");
    try {
      await addDoc(collection(db, "inversiones"), {
        nombre,
        monto: parseFloat(monto),
        fecha,
        comentarios
      });
      setNombre(""); setMonto(""); setFecha(""); setComentarios("");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este registro de inversión?")) {
      await deleteDoc(doc(db, "inversiones", id));
    }
  };

  const totalInvertido = inversiones.reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Gestión de Inversiones</h2>
      
      <div className="glass" style={{ padding: "20px", marginBottom: "30px" }}>
        <h3>Registrar Nueva Inversión</h3>
        <form onSubmit={handleAddInversion} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "15px" }}>
          <div>
            <label>Inversionista / Origen</label>
            <input required value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <label>Monto (S/)</label>
            <input required type="number" step="0.1" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label>Fecha</label>
            <input required type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Comentarios / Acuerdos</label>
            <textarea value={comentarios} onChange={e=>setComentarios(e.target.value)} placeholder="Condiciones, plazos, etc." rows="2"></textarea>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="btn-primary" style={{ width: "100%" }}>Guardar Inversión</button>
          </div>
        </form>
      </div>

      <div className="glass" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <h3>Historial de Inversiones</h3>
          <div style={{ background: "rgba(16, 185, 129, 0.2)", padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--accent)" }}>
            Total Invertido: <strong style={{ color: "var(--accent)", fontSize: "1.2rem" }}>S/ {totalInvertido.toFixed(2)}</strong>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Inversionista</th>
                <th>Monto</th>
                <th>Comentarios</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inversiones.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.fecha}</td>
                  <td><strong>{inv.nombre}</strong></td>
                  <td style={{ color: "var(--accent)", fontWeight: "bold" }}>S/ {inv.monto.toFixed(2)}</td>
                  <td style={{ maxWidth: "250px", whiteSpace: "normal" }}>{inv.comentarios}</td>
                  <td>
                    <button onClick={() => handleDelete(inv.id)} style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "none", padding: "8px", borderRadius: "4px", cursor: "pointer" }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {inversiones.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                    No hay inversiones registradas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
