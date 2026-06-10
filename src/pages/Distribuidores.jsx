import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { compressImageToBase64 } from "../utils";
import ConfirmModal from "../components/ConfirmModal";
import { Phone, MessageSquare, Plus, Edit2, Trash2, Search, X, Loader2 } from "lucide-react";

export default function Distribuidores() {
  const [distribuidores, setDistribuidores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState(null);
  const [editId, setEditId] = useState(null);

  // Delete modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [distToDelete, setDistToDelete] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "distribuidores"), (snapshot) => {
      const docs = [];
      snapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
      setDistribuidores(docs);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) return alert("Nombre y Teléfono son requeridos");
    setLoading(true);

    try {
      let imageUrl = "";
      if (imagen) {
        imageUrl = await compressImageToBase64(imagen);
      } else if (editId) {
        const current = distribuidores.find(d => d.id === editId);
        imageUrl = current?.imageUrl || "";
      }

      const data = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        descripcion: descripcion.trim(),
        imageUrl
      };

      if (editId) {
        await updateDoc(doc(db, "distribuidores", editId), data);
        setEditId(null);
      } else {
        await addDoc(collection(db, "distribuidores"), data);
      }

      // Reset form
      setNombre("");
      setTelefono("");
      setDescripcion("");
      setImagen(null);
      setShowForm(false);
    } catch (err) {
      console.error("Error saving distributor:", err);
      alert("Error al guardar distribuidor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (d) => {
    setEditId(d.id);
    setNombre(d.nombre);
    setTelefono(d.telefono);
    setDescripcion(d.descripcion || "");
    setImagen(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (d) => {
    setDistToDelete(d);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (distToDelete) {
      try {
        await deleteDoc(doc(db, "distribuidores", distToDelete.id));
        setDistToDelete(null);
      } catch (err) {
        console.error("Error deleting:", err);
        alert("Error al eliminar");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setNombre("");
    setTelefono("");
    setDescripcion("");
    setImagen(null);
    setShowForm(false);
  };

  const getWhatsAppUrl = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    // If it's a standard Peruvian mobile number without code (9 digits), prepend 51
    const prefix = cleaned.length === 9 ? "51" : "";
    return `https://api.whatsapp.com/send?phone=${prefix}${cleaned}`;
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const filtered = distribuidores.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      d.nombre.toLowerCase().includes(term) ||
      (d.descripcion && d.descripcion.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ paddingBottom: "50px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "700" }}>Directorio de Distribuidores</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "4px" }}>
            Mantén organizada la información de contacto y productos de tus proveedores.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            if (showForm) {
              handleCancelEdit();
            } else {
              setShowForm(true);
            }
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Nuevo Distribuidor"}
        </button>
      </div>

      {/* Accordion / Collapsible Form */}
      {showForm && (
        <div className="glass" style={{ padding: "25px", marginBottom: "30px", background: "var(--glass-bg)" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "20px" }}>
            {editId ? "Editar Distribuidor" : "Registrar Nuevo Distribuidor"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>Nombre del Distribuidor *</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Distribuidora Leyrin"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{ background: "rgba(0,0,0,0.2)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>Número de Contacto *</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: 930665123"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  style={{ background: "rgba(0,0,0,0.2)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>¿Qué vende / suministra?</label>
                <textarea
                  placeholder="Ej: Cajas personalizadas, cintas de satén, chocolates, tazas..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--glass-border)",
                    color: "white",
                    resize: "none",
                    outline: "none",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", justifyContent: "space-between" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem" }}>Foto del Distribuidor (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagen(e.target.files[0])}
                  style={{ padding: "8px", background: "rgba(0,0,0,0.2)" }}
                />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Sube una foto representativa o logotipo para identificarlo fácilmente.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-primary"
                  style={{ flex: 1, background: "transparent", border: "1px solid var(--glass-border)", color: "white" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {editId ? "Guardar Cambios" : "Registrar Distribuidor"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px", maxWidth: "450px", position: "relative" }}>
        <input
          type="text"
          placeholder="🔍 Buscar distribuidor por nombre o producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            paddingLeft: "40px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--glass-border)",
            borderRadius: "8px",
            color: "white",
            height: "45px",
          }}
        />
        <Search
          size={18}
          style={{ position: "absolute", left: "14px", top: "14px", color: "var(--text-muted)" }}
        />
      </div>

      {/* Distributors Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {filtered.map((d) => (
          <div
            key={d.id}
            className="glass"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              background: "var(--glass-bg)",
              position: "relative",
            }}
          >
            {/* Upper Section: Image & Info */}
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              {d.imageUrl ? (
                <img
                  src={d.imageUrl}
                  alt={d.nombre}
                  style={{ width: "65px", height: "65px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--glass-border)" }}
                />
              ) : (
                <div
                  style={{
                    width: "65px",
                    height: "65px",
                    borderRadius: "50%",
                    background: "rgba(59, 130, 246, 0.2)",
                    border: "2px solid rgba(59, 130, 246, 0.4)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                  }}
                >
                  {getInitials(d.nombre)}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "600", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.nombre}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                  <Phone size={12} />
                  <span>{d.telefono}</span>
                </div>
              </div>
            </div>

            {/* Middle Section: Suministros */}
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", flex: 1 }}>
              <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: "500" }}>Suministra / Vende:</span>
              <p style={{ color: "var(--text-main)", margin: 0, lineHeight: "1.4" }}>
                {d.descripcion || "Sin descripción de productos registrada."}
              </p>
            </div>

            {/* Bottom Section: Actions */}
            <div style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
              <button
                onClick={() => window.open(getWhatsAppUrl(d.telefono), "_blank")}
                className="btn-primary"
                style={{
                  flex: 1.5,
                  background: "rgba(37, 211, 102, 0.15)",
                  border: "1px solid rgba(37, 211, 102, 0.3)",
                  color: "#25D366",
                  fontSize: "0.85rem",
                  padding: "8px",
                }}
              >
                <MessageSquare size={14} /> WhatsApp
              </button>
              
              <button
                onClick={() => handleEditClick(d)}
                className="btn-primary"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-main)",
                  fontSize: "0.85rem",
                  padding: "8px",
                }}
              >
                <Edit2 size={12} /> Editar
              </button>

              <button
                onClick={() => handleDeleteClick(d)}
                className="btn-primary"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "var(--danger)",
                  padding: "8px",
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ color: "var(--text-muted)", gridColumn: "span 4", textAlign: "center", padding: "40px" }}>
            No se encontraron distribuidores registrados.
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar Distribuidor?"
        message={`Estás a punto de eliminar a "${distToDelete?.nombre}". Se perderán todos sus datos de contacto.`}
      />
    </div>
  );
}
