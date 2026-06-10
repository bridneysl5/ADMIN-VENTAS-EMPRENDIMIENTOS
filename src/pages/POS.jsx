import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import ModalTicket from "../components/ModalTicket";
import { Trash2, Plus, Minus, LayoutGrid, List, ShoppingCart, X } from "lucide-react";

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEmprendimiento, setFiltroEmprendimiento] = useState("Todos");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  useEffect(() => {
    setCategoriaSeleccionada("Todas");
  }, [filtroEmprendimiento]);

  // Obtener categorías disponibles de forma reactiva
  const categoriasDisponibles = ["Todas", ...new Set(productos
    .filter(p => filtroEmprendimiento === "Todos" || p.emprendimiento === filtroEmprendimiento)
    .flatMap(p => p.categoria || [])
  )];

  // Filtrar y ordenar alfabéticamente
  const filteredProducts = productos
    .filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => filtroEmprendimiento === "Todos" || p.emprendimiento === filtroEmprendimiento)
    .filter(p => {
      if (categoriaSeleccionada === "Todas") return true;
      return p.categoria && p.categoria.includes(categoriaSeleccionada);
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

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

  const getLotes = (insumo) => {
    if (insumo.lotes && Array.isArray(insumo.lotes)) {
      return insumo.lotes;
    }
    return [{
      cantMayor: insumo.cantMayor || 0,
      costoTotal: insumo.costoTotal || 0,
      cantMenorTotal: insumo.cantMenorTotal || 0,
      costoMenor: insumo.costoMenor || 0,
      fecha: insumo.fecha || new Date().toISOString()
    }];
  };

  const processSale = async () => {
    if(carrito.length === 0) return;
    
    // 1. Calcular el costo exacto de ingredientes usando FIFO
    let costoTotalVentaFIFO = 0;
    for (let item of carrito) {
      let costoItemFIFO = 0;
      for (let r of item.receta) {
        const insDb = insumos.find(i => i.id === r.idInsumo);
        if (insDb) {
          let cantADescontar = r.cant * item.qty;
          const currentLotes = getLotes(insDb);
          
          for (let lote of currentLotes) {
            if (cantADescontar <= 0) break;
            const consumedFromLote = Math.min(lote.cantMenorTotal, cantADescontar);
            costoItemFIFO += consumedFromLote * lote.costoMenor;
            cantADescontar -= consumedFromLote;
          }
          // Si por alguna razón falta stock en los lotes, usar el costoMenor general como fallback
          if (cantADescontar > 0) {
            costoItemFIFO += cantADescontar * insDb.costoMenor;
          }
        }
      }
      // Sumar el costo de insumos del ítem y su mano de obra multiplicados por la cantidad
      costoTotalVentaFIFO += costoItemFIFO + ((item.costoManoObra || 0) * item.qty);
    }

    // 2. Descontar inventario en Firebase con lógica FIFO
    for (let item of carrito) {
      for (let r of item.receta) {
        const insDb = insumos.find(i => i.id === r.idInsumo);
        if(insDb) {
          let cantADescontar = r.cant * item.qty;
          const currentLotes = getLotes(insDb);
          const updatedLotes = [];
          
          for (let lote of currentLotes) {
            if (cantADescontar <= 0) {
              updatedLotes.push(lote);
            } else if (lote.cantMenorTotal <= cantADescontar) {
              cantADescontar -= lote.cantMenorTotal;
            } else {
              const newCantLote = lote.cantMenorTotal - cantADescontar;
              const newCantMayorLote = newCantLote / (insDb.factor || 1);
              updatedLotes.push({
                ...lote,
                cantMenorTotal: newCantLote,
                cantMayor: newCantMayorLote,
                costoTotal: newCantLote * lote.costoMenor
              });
              cantADescontar = 0;
            }
          }
          
          const totalCantMenor = updatedLotes.reduce((sum, l) => sum + l.cantMenorTotal, 0);
          const totalCosto = updatedLotes.reduce((sum, l) => sum + (l.cantMenorTotal * l.costoMenor), 0);
          const nuevoCostoMenor = totalCantMenor > 0 ? (totalCosto / totalCantMenor) : insDb.costoMenor;
          const totalCantMayor = totalCantMenor / (insDb.factor || 1);
          
          await updateDoc(doc(db, "insumos", insDb.id), {
            lotes: updatedLotes,
            cantMenorTotal: totalCantMenor,
            cantMayor: totalCantMayor,
            costoTotal: totalCosto,
            costoMenor: nuevoCostoMenor
          });
        }
      }
    }

    const pedidoId = "PED-" + Math.floor(1000 + Math.random() * 9000);
    const gananciaReal = total - costoTotalVentaFIFO;

    // Registrar Venta
    await addDoc(collection(db, "ventas"), {
      tipo: "ingreso", 
      pedidoId,
      total, 
      costoTotal: costoTotalVentaFIFO, 
      ganancia: gananciaReal, 
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
    setIsCartModalOpen(false); // Close modal after sale on mobile
  };

  const renderCartPanel = () => (
    <>
      <h3 style={{ marginBottom: "10px" }}>Venta Actual</h3>
      <div style={{ flex: 1, overflowY: "auto", margin: "10px 0", paddingRight: "5px" }}>
        {carrito.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "20px" }}>El carrito está vacío</p>}
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
              
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
                <input type="checkbox" checked={incluyeDelivery} onChange={e=>setIncluyeDelivery(e.target.checked)} style={{ width: "auto", margin: 0 }} />
                ¿Incluye Delivery?
              </label>
              
              {incluyeDelivery && (
                <input type="number" step="0.1" placeholder="Costo de Delivery (S/)" value={costoDelivery} onChange={e=>setCostoDelivery(e.target.value)} />
              )}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "15px", marginTop: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <span>Subtotal:</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>
        {incluyeDelivery && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            <span>Delivery:</span>
            <span>S/ {deliveryMonto.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.3rem", fontWeight: "bold", margin: "10px 0" }}>
          <span>Total a Cobrar:</span>
          <span>S/ {total.toFixed(2)}</span>
        </div>
        <button onClick={processSale} className="btn-primary" style={{ width: "100%", padding: "15px", fontSize: "1.1rem" }}>Cobrar Venta</button>
      </div>
    </>
  );

  return (
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", height: "100%" }}>
      <div className="glass" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%" }}>
        
        {/* Encabezado y Filtros */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <h2 style={{ margin: 0 }}>Catálogo para Vender</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Alternador de Vista (Cuadrícula / Lista) */}
            <div className="glass" style={{ display: "flex", padding: "4px", gap: "4px", borderRadius: "8px", background: "rgba(0,0,0,0.2)" }}>
              <button 
                type="button" 
                onClick={() => setViewMode("grid")}
                style={{
                  background: viewMode === "grid" ? "var(--primary)" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  padding: "6px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Vista Cuadrícula"
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                type="button" 
                onClick={() => setViewMode("list")}
                style={{
                  background: viewMode === "list" ? "var(--primary)" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  padding: "6px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Vista Lista Compacta"
              >
                <List size={16} />
              </button>
            </div>

            <select
              value={filtroEmprendimiento}
              onChange={e => setFiltroEmprendimiento(e.target.value)}
              style={{ width: "180px", padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(0,0,0,0.5)", color: "white", outline: "none" }}
            >
              <option value="Todos">Todos (Emprendimientos)</option>
              <option value="Regalos">Regalos</option>
              <option value="Tortas">Tortas</option>
            </select>
            <input 
              type="text" 
              placeholder="🔍 Buscar producto..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: "220px", padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.1)", color: "white" }}
            />
          </div>
        </div>

        {/* Categorías Dinámicas */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          overflowX: "auto", 
          flexWrap: "nowrap",
          paddingBottom: "12px", 
          marginBottom: "20px",
          borderBottom: "1px solid var(--glass-border)",
          scrollbarWidth: "thin",
          maxWidth: "100%"
        }}>
          {categoriasDisponibles.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaSeleccionada(cat)}
              style={{
                background: categoriaSeleccionada === cat ? "var(--primary)" : "rgba(255,255,255,0.05)",
                color: "white",
                border: categoriaSeleccionada === cat ? "none" : "1px solid var(--glass-border)",
                padding: "8px 16px",
                borderRadius: "20px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                fontSize: "0.85rem",
                fontWeight: categoriaSeleccionada === cat ? "bold" : "normal",
                transition: "all 0.2s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Listado de Productos */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }}>
          {filteredProducts.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>No se encontraron productos en este filtro.</p>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
              {filteredProducts.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p)} 
                  style={{ 
                    background: "rgba(0,0,0,0.2)", 
                    border: "1px solid var(--glass-border)", 
                    padding: "15px", 
                    borderRadius: "12px", 
                    cursor: "pointer", 
                    textAlign: "center",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    minHeight: "220px",
                    transition: "transform 0.2s, background-color 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.2)";
                  }}
                >
                  <div>
                    <span style={{ 
                      position: "absolute", 
                      top: "8px", 
                      left: "8px", 
                      background: p.emprendimiento === "Regalos" ? "#ec4899" : p.emprendimiento === "Tortas" ? "#f59e0b" : "var(--primary)", 
                      padding: "2px 6px", 
                      borderRadius: "8px", 
                      fontSize: "9px", 
                      fontWeight: "bold",
                      color: "white",
                      zIndex: 1
                    }}>
                      {p.emprendimiento || "General"}
                    </span>
                    
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.nombre} style={{ width: "100%", height: "110px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px" }} />
                    ) : (
                      <div style={{ width: "100%", height: "110px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>Sin foto</div>
                    )}
                    <h4 style={{ fontSize: "0.95rem", margin: "5px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.nombre}>{p.nombre}</h4>
                  </div>
                  <p style={{ color: "var(--accent)", fontWeight: "bold", marginTop: "5px", fontSize: "1.1rem" }}>S/ {p.precioVenta.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredProducts.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p)} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    background: "rgba(0,0,0,0.15)", 
                    border: "1px solid var(--glass-border)", 
                    padding: "8px 15px", 
                    borderRadius: "8px", 
                    cursor: "pointer",
                    transition: "background-color 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.15)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.nombre} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }} />
                    ) : (
                      <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.7rem" }}>Sin foto</div>
                    )}
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{p.nombre}</h4>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        color: "var(--text-muted)",
                        display: "inline-flex",
                        gap: "5px",
                        marginTop: "2px"
                      }}>
                        <span style={{ color: p.emprendimiento === "Regalos" ? "#ec4899" : p.emprendimiento === "Tortas" ? "#f59e0b" : "var(--primary)" }}>
                          {p.emprendimiento}
                        </span>
                        {p.categoria && p.categoria.length > 0 && `• ${p.categoria.join(", ")}`}
                      </span>
                    </div>
                  </div>
                  <strong style={{ color: "var(--accent)", fontSize: "1.1rem" }}>S/ {p.precioVenta.toFixed(2)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass desktop-cart" style={{ padding: "20px", display: "flex", flexDirection: "column", position: "sticky", top: "20px", maxHeight: "calc(100vh - 40px)" }}>
        {renderCartPanel()}
      </div>

      {/* Floating Button for Mobile */}
      <button 
        className="mobile-cart-fab"
        onClick={() => setIsCartModalOpen(true)}
      >
        <ShoppingCart size={24} />
        {carrito.length > 0 && <span className="cart-badge">{carrito.reduce((a, b) => a + b.qty, 0)}</span>}
      </button>

      {/* Mobile Cart Modal */}
      {isCartModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCartModalOpen(false)}>
          <div className="modal-content mobile-cart-modal" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
                <button onClick={() => setIsCartModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '5px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
             </div>
             {renderCartPanel()}
          </div>
        </div>
      )}

      <ModalTicket ticket={lastTicket} onClose={() => setLastTicket(null)} />
    </div>
  );
}
