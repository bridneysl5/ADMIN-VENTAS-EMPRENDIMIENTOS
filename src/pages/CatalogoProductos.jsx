import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import ConfirmModal from "../components/ConfirmModal";
import ModalEditarProducto from "../components/ModalEditarProducto";
import { Pencil, Trash2 } from "lucide-react";

export default function CatalogoProductos() {
  const [productos, setProductos] = useState([]);
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [prodToDelete, setProdToDelete] = useState(null);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [prodToEdit, setProdToEdit] = useState(null);

  useEffect(() => {
    const unsubProds = onSnapshot(collection(db, "productos"), (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      setProductos(docs);
    });
    return () => unsubProds();
  }, []);

  const handleDeleteClick = (p) => {
    setProdToDelete(p);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (prodToDelete) {
      await deleteDoc(doc(db, "productos", prodToDelete.id));
      setProdToDelete(null);
    }
  };

  const handleEditClick = (p) => {
    setProdToEdit(p);
    setIsEditOpen(true);
  };

  const filteredProductos = productos.filter(p => {
    // Filtrar por Emprendimiento
    if (activeTab !== "Todos" && (p.emprendimiento || "General") !== activeTab) return false;
    // Filtrar por Búsqueda (Nombre)
    if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <h2>Mi Catálogo (Multi-Emprendimiento)</h2>
        
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {["Todos", "General", "Regalos", "Tortas"].map(tab => (
            <button 
              key={tab}
              className="btn-primary" 
              style={{ background: activeTab === tab ? "var(--primary)" : "rgba(255,255,255,0.1)", border: activeTab === tab ? "none" : "1px solid var(--glass-border)" }} 
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input 
          type="text" 
          placeholder="🔍 Buscar producto por nombre..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", maxWidth: "400px", padding: "12px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(0,0,0,0.2)", color: "white" }}
        />
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {filteredProductos.map(p => (
          <div key={p.id} className="glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px", position: "relative" }}>
            
            <span style={{ position: "absolute", top: "10px", right: "10px", background: "var(--primary)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
              {p.emprendimiento || "General"}
            </span>

            {p.imageUrl && <img src={p.imageUrl} alt={p.nombre} style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px" }} />}
            
            <div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "5px" }}>{p.nombre}</h3>
              <p style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "1.5rem" }}>S/ {p.precioVenta.toFixed(2)}</p>
            </div>
            
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "8px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ color: "var(--text-muted)" }}>Costo Insumos:</span>
                <span>S/ {(p.costoReceta || p.costoReal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ color: "var(--text-muted)" }}>Mano de Obra:</span>
                <span>S/ {(p.costoManoObra || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", paddingTop: "5px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <span>Costo Total:</span>
                <span style={{ color: "var(--danger)" }}>S/ {(p.costoReal || 0).toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
              <button onClick={() => handleEditClick(p)} className="btn-primary" style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid var(--glass-border)" }}>
                <Pencil size={16} /> Editar
              </button>
              <button onClick={() => handleDeleteClick(p)} className="btn-primary" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)" }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filteredProductos.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>No hay productos en esta pestaña.</p>
        )}
      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={confirmDelete}
        title="¿Eliminar Producto?"
        message={`Estás a punto de eliminar "${prodToDelete?.nombre}".`}
      />

      <ModalEditarProducto 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        producto={prodToEdit} 
      />
    </div>
  );
}
