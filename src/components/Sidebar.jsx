import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, PenTool, ShoppingCart, BarChart3 } from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { name: "Inicio (Dashboard)", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Mis Productos", path: "/catalogo", icon: <Package size={20} /> },
    { name: "Crear Producto", path: "/crear-producto", icon: <PenTool size={20} /> },
    { name: "Vender", path: "/pos", icon: <ShoppingCart size={20} /> },
    { name: "Contabilidad", path: "/contabilidad", icon: <BarChart3 size={20} /> },
  ];

  return (
    <div style={{ width: "260px", background: "var(--sidebar-bg)", borderRight: "1px solid var(--glass-border)", padding: "2rem 1rem", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "1.5rem", fontWeight: "700", marginBottom: "3rem", padding: "0 1rem" }}>
        <LayoutDashboard color="var(--primary)" />
        <span>AdminVentas</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
  );
}
