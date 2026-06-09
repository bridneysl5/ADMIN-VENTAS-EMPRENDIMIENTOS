import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ModalEditarVenta({ isOpen, onClose, venta }) {
  const [direccion, setDireccion] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [incluyeDelivery, setIncluyeDelivery] = useState(false);
  const [costoDelivery, setCostoDelivery] = useState("");
  const [total, setTotal] = useState("");

  useEffect(() => {
    if (isOpen && venta) {
      setDireccion(venta.detalles?.direccion || "");
      setComentarios(venta.detalles?.comentarios || "");
      setIncluyeDelivery(venta.detalles?.incluyeDelivery || false);
      setCostoDelivery(venta.detalles?.costoDelivery || "");
      setTotal(venta.total || "");
    }
  }, [isOpen, venta]);

  if (!isOpen || !venta) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const nuevoTotal = parseFloat(total);
      const deliveryMonto = incluyeDelivery ? (parseFloat(costoDelivery) || 0) : 0;
      
      // La ganancia neta puede cambiar si modificamos el total cobrado
      const ganancia = nuevoTotal - (venta.costoTotal || 0);

      await updateDoc(doc(db, "ventas", venta.id), {
        total: nuevoTotal,
        ganancia: ganancia,
        detalles: {
          ...venta.detalles,
          direccion,
          comentarios,
          incluyeDelivery,
          costoDelivery: deliveryMonto
        }
      });
      alert("¡Venta actualizada!");
      onClose();
    } catch (error) {
      console.error("Error al actualizar venta:", error);
      alert("Error al actualizar");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ width: "90%", maxWidth: "500px" }}>
        <h3 style={{ marginBottom: "20px" }}>Editar Venta (ID: {venta.pedidoId || "Antigua"})</h3>
        <p style={{ color: "var(--warning)", fontSize: "0.85rem", marginBottom: "15px", lineHeight: 1.4 }}>
          <strong>Nota:</strong> Solo puedes modificar los datos logísticos y el dinero cobrado. No se pueden modificar los productos para no desajustar el inventario.
        </p>

        <form onSubmit={handleUpdate} style={{ display: "grid", gap: "15px" }}>
          <div>
            <label>Total Cobrado (S/)</label>
            <input type="number" step="0.01" required value={total} onChange={e=>setTotal(e.target.value)} />
          </div>

          <div>
            <label>Dirección de Envío</label>
            <input value={direccion} onChange={e=>setDireccion(e.target.value)} />
          </div>
          
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={incluyeDelivery} onChange={e=>setIncluyeDelivery(e.target.checked)} style={{ width: "auto", margin: 0 }} />
            ¿Incluye Delivery?
          </label>
          
          {incluyeDelivery && (
            <div>
              <label>Costo de Delivery (S/)</label>
              <input type="number" step="0.1" value={costoDelivery} onChange={e=>setCostoDelivery(e.target.value)} />
            </div>
          )}

          <div>
            <label>Comentarios / Notas</label>
            <textarea value={comentarios} onChange={e=>setComentarios(e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid var(--glass-border)", color: "white", padding: "10px", borderRadius: "8px", resize: "none" }} rows="3"></textarea>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "10px 20px" }}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ padding: "10px 20px" }}>Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}
