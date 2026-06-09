import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import ModalTicket from "../components/ModalTicket";
import { Trash2, Plus, Minus } from "lucide-react";

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Pedido info
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [incluyeDelivery, setIncluyeDelivery] = useState(false);
  const [costoDelivery, setCostoDelivery] = useState("");
  const [lastTicket, setLastTicket] = useState(null);

  useEffect(() => {
    const unsubProds = onSnapshot(collection(db, "productos"), (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      setProductos(docs);
    });
    const unsubInsumos = onSnapshot(collection(db, "insumos"), (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      setInsumos(docs);
    });
    return () => { unsubProds(); unsubInsumos(); };
  }, []);

  const addToCart = (prod) => {
    let canSell = true;
    let missingItem = "";
    for (let r of prod.receta) {
      const insDb = insumos.find(i => i.id === r.idInsumo);
      if(!insDb || insDb.cantMenorTotal < r.cant) {
        canSell = false;
        missingItem = insDb ? insDb.nombre : r.nombre;
        break;
      }
    }
    if(!canSell) return alert(`No hay suficiente inventario de: ${missingItem}`);

    const existing = carrito.find(c => c.id === prod.id);
    if(existing) {
      setCarrito(carrito.map(c => c.id === prod.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCarrito([...carrito, { ...prod, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCarrito(carrito.map(c => {
      if(c.id === id) {
        const newQty = c.qty + delta;
        return newQty > 0 ? { ...c, qty: newQty } : c;
      }
      return c;
    }));
  };

  const removeFromCart = (id) => {
    setCarrito(carrito.filter(c => c.id !== id));
  };

  const subtotal = carrito.reduce((acc, item) => acc + (item.precioVenta * item.qty), 0);
  const costoTotalProductos = carrito.reduce((acc, item) => acc + (item.costoReal * item.qty), 0);
  const deliveryMonto = incluyeDelivery ? (parseFloat(costoDelivery) || 0) : 0;
  const total = subtotal + deliveryMonto;

  const processSale = async () => {
    if(carrito.length === 0) return;
    
    // Descontar inventario en Firebase
    for (let item of carrito) {
      for (let r of item.receta) {
        const insDb = insumos.find(i => i.id === r.idInsumo);
        if(insDb) {
          const newCant = insDb.cantMenorTotal - (r.cant * item.qty);
          await updateDoc(doc(db, "insumos", insDb.id), { cantMenorTotal: newCant });
        }
      }
    }

    const pedidoId = "PED-" + Math.floor(1000 + Math.random() * 9000);

    // Registrar Venta
    await addDoc(collection(db, "ventas"), {
      tipo: "ingreso", 
      pedidoId,
      total, 
      costoTotal: costoTotalProductos, 
      ganancia: total - costoTotalProductos, // Asumimos que el delivery es ingreso neto o neutro, simplificamos.
      items: carrito, 
      fecha: new Date().toISOString(),
      detalles: {
        telefono,
        direccion,
        comentarios,
        incluyeDelivery,
        costoDelivery: deliveryMonto
      }
    });

    setLastTicket({
      pedidoId,
      items: carrito,
      total,
      detalles: { telefono, direccion, comentarios, incluyeDelivery, costoDelivery: deliveryMonto }
    });

    setCarrito([]); setTelefono(""); setDireccion(""); setComentarios(""); setIncluyeDelivery(false); setCostoDelivery("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", height: "100%" }}>
      <div className="glass" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>Catálogo para Vender</h2>
          <input 
            type="text" 
            placeholder="🔍 Buscar producto..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "250px", padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.1)", color: "white" }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
          {productos
            .filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(p => (
            <div key={p.id} onClick={() => addToCart(p)} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--glass-border)", padding: "15px", borderRadius: "8px", cursor: "pointer", textAlign: "center" }}>
              {p.imageUrl && <img src={p.imageUrl} alt={p.nombre} style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }} />}
              <h4>{p.nombre}</h4>
              <p style={{ color: "var(--accent)", fontWeight: "bold", marginTop: "10px", fontSize: "1.2rem" }}>S/ {p.precioVenta.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass" style={{ padding: "20px", display: "flex", flexDirection: "column", position: "sticky", top: "20px", maxHeight: "calc(100vh - 40px)" }}>
        <h3>Venta Actual</h3>
        <div style={{ flex: 1, overflowY: "auto", margin: "20px 0", paddingRight: "5px" }}>
          {carrito.map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "8px", marginBottom: "10px" }}>
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", marginBottom: "5px" }}>{c.nombre}</strong>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button onClick={() => updateQty(c.id, -1)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "5px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Minus size={14} />
                  </button>
                  <span>{c.qty}</span>
                  <button onClick={() => updateQty(c.id, 1)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "5px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                <strong>S/ {(c.qty * c.precioVenta).toFixed(2)}</strong>
                <button onClick={() => removeFromCart(c.id)} style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "none", padding: "5px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {carrito.length > 0 && (
            <div style={{ marginTop: "20px", background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "8px" }}>
              <h4 style={{ marginBottom: "10px" }}>Detalles del Pedido</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input placeholder="WhatsApp del Cliente (Ej: 999111222)" type="tel" value={telefono} onChange={e=>setTelefono(e.target.value)} />
                <input placeholder="Dirección de envío" value={direccion} onChange={e=>setDireccion(e.target.value)} />
                <textarea placeholder="Comentarios / Notas" value={comentarios} onChange={e=>setComentarios(e.target.value)} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--glass-border)", padding: "10px", borderRadius: "8px", color: "white", outline: "none", width: "100%", resize: "none" }} rows="2"></textarea>
                
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" checked={incluyeDelivery} onChange={e=>setIncluyeDelivery(e.target.checked)} style={{ width: "auto" }} />
                  ¿Incluye Delivery?
                </label>
                
                {incluyeDelivery && (
                  <input type="number" step="0.1" placeholder="Costo de Delivery (S/)" value={costoDelivery} onChange={e=>setCostoDelivery(e.target.value)} />
                )}
              </div>
            </div>
          )}
        </div>
        
        <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "var(--text-muted)" }}>
            <span>Subtotal:</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          {incluyeDelivery && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "var(--text-muted)" }}>
              <span>Delivery:</span>
              <span>S/ {deliveryMonto.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.5rem", fontWeight: "bold", margin: "10px 0" }}>
            <span>Total a Cobrar:</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
          <button onClick={processSale} className="btn-primary" style={{ width: "100%", padding: "15px", fontSize: "1.1rem" }}>Cobrar Venta</button>
        </div>
      </div>

      <ModalTicket ticket={lastTicket} onClose={() => setLastTicket(null)} />
    </div>
  );
}
