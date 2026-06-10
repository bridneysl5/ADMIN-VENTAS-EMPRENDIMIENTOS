import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, PenTool, ShoppingCart, BarChart3, MessageSquare, Users, X } from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { name: "Inicio (Dashboard)", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Mis Productos", path: "/catalogo", icon: <Package size={20} /> },
    { name: "Crear Producto", path: "/crear-producto", icon: <PenTool size={20} /> },
    { name: "Vender", path: "/pos", icon: <ShoppingCart size={20} /> },
    { name: "Contabilidad", path: "/contabilidad", icon: <BarChart3 size={20} /> },
    { name: "Marketing (WhatsApp)", path: "/marketing", icon: <MessageSquare size={20} /> },
    { name: "Distribuidores", path: "/distribuidores", icon: <Users size={20} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 999
          }}
        />
      )}

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3rem", padding: "0 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "1.5rem", fontWeight: "700" }}>
            <LayoutDashboard color="var(--primary)" />
            <span>AdminVentas</span>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "50%",
              color: "white",
              width: "36px",
              height: "36px",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              display: "none" // Displayed via CSS on mobile
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: "12px", padding: "12px 1rem", borderRadius: "8px", textDecoration: "none", transition: "all 0.3s ease",
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "white" : "var(--text-muted)",
                fontWeight: isActive ? "500" : "400"
              })}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
