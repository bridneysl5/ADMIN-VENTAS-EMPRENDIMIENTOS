import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import ConfirmModal from "../components/ConfirmModal";
import ModalEditarVenta from "../components/ModalEditarVenta";
import { Trash2, Edit2, MessageCircle } from "lucide-react";

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [ventaToDelete, setVentaToDelete] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [ventaToEdit, setVentaToEdit] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "ventas"), where("tipo", "==", "ingreso"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      // Ordenar localmente por fecha descendente
      docs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setVentas(docs);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = (venta) => {
    setVentaToDelete(venta);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (ventaToDelete) {
      await deleteDoc(doc(db, "ventas", ventaToDelete.id));
      setVentaToDelete(null);
    }
  };

  const updateEstado = async (id, nuevoEstado) => {
    await updateDoc(doc(db, "ventas", id), { estado: nuevoEstado });
  };

  const openWhatsApp = (venta) => {
    const tel = venta.detalles?.telefono;
    if (!tel) return alert("Esta venta no tiene número de WhatsApp guardado.");
    
    let itemsText = venta.items?.map(i => `${i.qty}x ${i.nombre} (S/ ${(i.qty*i.precioVenta).toFixed(2)})`).join('%0A') || "";
    let msg = `*TICKET DE PEDIDO: ${venta.pedidoId || "S/N"}*%0A`;
    msg += `---------------------------%0A`;
    msg += `${itemsText}%0A`;
    msg += `---------------------------%0A`;
    if (venta.detalles?.incluyeDelivery) {
      msg += `Delivery: S/ ${venta.detalles.costoDelivery.toFixed(2)}%0A`;
    }
    msg += `*TOTAL: S/ ${venta.total.toFixed(2)}*%0A%0A`;
    msg += `¡Gracias por tu compra! Tu pedido está confirmado.`;

    window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
  };

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Historial de Ventas y Pedidos</h2>
      <div className="glass" style={{ padding: "20px", overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Fecha</th>
              <th>Productos Vendidos</th>
              <th>Total Cobrado</th>
              <th>Ganancia Neta</th>
              <th>Estado</th>
              <th>Detalles / Envío</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No hay ventas registradas aún.</td></tr>
            )}
            {ventas.map(v => (
              <tr key={v.id}>
                <td><strong>{v.pedidoId || "N/A"}</strong></td>
                <td>{new Date(v.fecha).toLocaleString()}</td>
                <td>
                  <ul style={{ paddingLeft: "20px", margin: 0 }}>
                    {v.items?.map((item, idx) => (
                      <li key={idx}>{item.qty}x {item.nombre}</li>
                    ))}
                  </ul>
                </td>
                <td style={{ fontWeight: "bold" }}>S/ {v.total.toFixed(2)}</td>
                <td style={{ color: "var(--accent)", fontWeight: "bold" }}>S/ {v.ganancia.toFixed(2)}</td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.85rem" }}>
                    <label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <input 
                        type="checkbox" 
                        checked={v.estado === "Listo" || v.estado === "Entregado"} 
                        onChange={(e) => updateEstado(v.id, e.target.checked ? "Listo" : "Pendiente")}
                        style={{ marginRight: "5px", margin: 0 }}
                      /> Listo
                    </label>
                    <label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <input 
                        type="checkbox" 
                        checked={v.estado === "Entregado"} 
                        onChange={(e) => updateEstado(v.id, e.target.checked ? "Entregado" : (v.estado === "Entregado" ? "Listo" : v.estado))}
                        style={{ marginRight: "5px", margin: 0 }}
                      /> Entregado
                    </label>
                  </div>
                </td>
                <td>
                  {v.detalles && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "5px" }}>
                      {v.detalles.telefono && (
                        <button onClick={() => openWhatsApp(v)} className="btn-primary" style={{ background: "#25D366", color: "white", padding: "4px 8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "5px", width: "max-content", border: "none" }}>
                          <MessageCircle size={14} /> WhatsApp
                        </button>
                      )}
                      {v.detalles.direccion && <div><strong>Dir:</strong> {v.detalles.direccion}</div>}
                      {v.detalles.incluyeDelivery && <div><strong>Delivery:</strong> S/ {v.detalles.costoDelivery?.toFixed(2)}</div>}
                      {v.detalles.comentarios && <div style={{ fontStyle: "italic", marginTop: "4px" }}>"{v.detalles.comentarios}"</div>}
                    </div>
                  )}
                </td>
                <td style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => { setVentaToEdit(v); setIsEditOpen(true); }} className="btn-primary" style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", padding: "8px" }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(v)} className="btn-primary" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "8px" }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={confirmDelete}
        title="¿Eliminar Venta?"
        message="Estás a punto de eliminar este registro de venta del historial."
      />
      <ModalEditarVenta isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} venta={ventaToEdit} />
    </div>
  );
}
