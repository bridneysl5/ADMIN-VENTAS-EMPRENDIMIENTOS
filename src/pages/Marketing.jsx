import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { MessageSquare, Copy, Send, X, Search, Check, CreditCard, Truck, BookOpen, Clock } from "lucide-react";

export default function Marketing() {
  const [productos, setProductos] = useState([]);
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Template Form State
  const [greeting, setGreeting] = useState("");
  const [intro, setIntro] = useState("");
  const [closing, setClosing] = useState("");
  const [includePrice, setIncludePrice] = useState(true);
  const [selectedDetails, setSelectedDetails] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(null);

  // Predetermined Quick Messages
  const presetMessages = {
    pago: {
      title: "💳 Método de Pago (50/50)",
      description: "Adelanto del 50%, saldo contraentrega. Yape/Plin al 930665123.",
      icon: <CreditCard size={20} color="var(--primary)" />,
      text: `💳 *Método de Pago (50/50)*

¡Asegura tu pedido hoy mismo! Manejamos una modalidad súper cómoda:

Adelanto: 50% para iniciar la personalización.

Saldo: 50% restante contraentrega.

📲 Medios de pago: Puedes realizarlo por Yape o Plin al *930665123*.
(A nombre de Leyrin Aguilar)

🔄 Una vez realizado, por favor envíanos la captura del comprobante por aquí junto con los datos de envío para dejarlo agendado. ¡Gracias!`
    },
    delivery: {
      title: "🚗 Envíos & Delivery (Lima)",
      description: "Envíos a todo Lima Metropolitana. Motorizado propio o por su cuenta.",
      icon: <Truck size={20} color="var(--accent)" />,
      text: `🚗 *Envíos & Delivery (Lima)*

¡Llevamos tu sorpresa a donde nos indiques! ❤️ Realizamos envíos a todo Lima Metropolitana mediante dos opciones:

🛵 *Motorizado propio:* Coordinamos la entrega directa hasta la puerta de la casa u oficina con total cuidado.
📦 *Por tu cuenta:* Si lo prefieres, puedes mandar a recoger tu pedido con tu app de confianza (Rappi, PedidosYa, Indrive, etc.).

Cotiza tu envío enviándonos la dirección exacta o referencia. 🗺️✨`
    },
    catalogo: {
      title: "📖 Enviar Catálogo Web",
      description: "Enlace directo al catálogo interactivo en momentos-regalos.netlify.app.",
      icon: <BookOpen size={20} color="#a855f7" />,
      text: `📖 *¡Descubre nuestro Catálogo Web!*

¡Hola! Te invitamos a explorar todas las opciones hermosas que tenemos para sorprender a tus personas favoritas. ✨

👉 Entra a nuestro catálogo interactivo aquí: https://momentos-regalos.netlify.app

Encontrarás nuestras secciones especiales de Regalos y Tortas. Dale una mirada y cuéntanos cuál fue tu favorito para ayudarte a personalizarlo. 🎂🎁`
    },
    seguimiento: {
      title: "⏱️ Mensaje de Seguimiento",
      description: "Recordatorio amistoso para clientes que no responden sobre su pedido.",
      icon: <Clock size={20} color="#f59e0b" />,
      text: `👀 *Recordatorio Especial*

¡Hola! Paso por aquí para recordarte que seguimos listos para ayudarte a preparar ese detalle tan especial. 🥰

Como son productos 100% personalizados, nuestros cupos de producción semanales son limitados para asegurar que cada entrega quede perfecta. ✨

¿Te gustaría que reservemos tu cupo o tienes alguna duda con el diseño? ¡Avísame y lo armamos juntos! 🤝💼`
    }
  };

  const handleCopyPreset = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(key);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const handleSendPreset = (text) => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productos"), (snapshot) => {
      const docs = [];
      snapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
      setProductos(docs);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    setCopied(false);

    // Initial templates based on product details/emprendimiento
    const targetName = product.emprendimiento === "Tortas" ? "las delicias" : "sorprender a esa persona especial";
    
    setGreeting(`¡Hola! ✨ Somos *Momentos Especiales* y nos encanta que pienses en nosotros para ${targetName}. 🥰`);
    setIntro("Este año, queremos ayudarte a regalar más que un objeto: ¡una experiencia inolvidable! Nuestro detalle personalizado premium incluye:");
    setClosing("¡Hagamos que este momento sea inolvidable! Déjanos un mensaje para agendar tu pedido. 📅✨");
    setIncludePrice(true);
    setSelectedDetails(product.detalles || []);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleToggleDetail = (detail) => {
    if (selectedDetails.includes(detail)) {
      setSelectedDetails(selectedDetails.filter((d) => d !== detail));
    } else {
      setSelectedDetails([...selectedDetails, detail]);
    }
  };

  // Build the text block for WhatsApp
  const generateMessageText = () => {
    if (!selectedProduct) return "";

    const parts = [];
    if (greeting.trim()) parts.push(greeting.trim());
    if (intro.trim()) parts.push(intro.trim());

    if (selectedDetails.length > 0) {
      // If items already start with emojis or bullet styling, render directly. Else prepend bullet.
      const bulletList = selectedDetails
        .map((d) => {
          const trimmed = d.trim();
          if (/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/.test(trimmed)) {
            return trimmed;
          }
          return `• ${trimmed}`;
        })
        .join("\n");
      parts.push(bulletList);
    }

    if (includePrice) {
      parts.push(`💰 *Inversión:* S/ ${selectedProduct.precioVenta.toFixed(2)}`);
    }

    if (closing.trim()) {
      parts.push(closing.trim());
    }

    return parts.join("\n\n");
  };

  // Convert WhatsApp markdown (*bold* and newlines) to HTML for previewing
  const formatPreviewHtml = (text) => {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace *bold* with <strong>
    html = html.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    // Replace _italics_ with <em>
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");
    // Replace ~strike~ with <del>
    html = html.replace(/~(.*?)~/g, "<del>$1</del>");
    // Replace newlines with <br />
    html = html.replace(/\n/g, "<br />");

    return html;
  };

  const handleCopy = () => {
    const text = generateMessageText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const text = generateMessageText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const filtered = productos.filter((p) => {
    if (activeTab !== "Todos" && (p.emprendimiento || "General") !== activeTab) return false;
    if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ paddingBottom: "50px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "700" }}>Marketing & Respuestas de WhatsApp</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "4px" }}>
            Genera textos de venta profesionales para copiar o enviar directamente a tus clientes.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {["Todos", "General", "Regalos", "Tortas"].map((tab) => (
            <button
              key={tab}
              className="btn-primary"
              style={{
                background: activeTab === tab ? "var(--primary)" : "rgba(255,255,255,0.08)",
                border: activeTab === tab ? "none" : "1px solid var(--glass-border)",
                padding: "8px 16px",
                fontSize: "0.9rem",
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Mensajes Predeterminados Rápidos */}
      <div className="glass" style={{ padding: "20px", marginBottom: "30px", background: "rgba(30, 41, 59, 0.4)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquare size={18} color="var(--primary)" />
          Respuestas Rápidas Frecuentes
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
          {Object.entries(presetMessages).map(([key, msg]) => (
            <div 
              key={key} 
              style={{ 
                background: "rgba(0,0,0,0.2)", 
                border: "1px solid var(--glass-border)", 
                borderRadius: "10px", 
                padding: "15px", 
                display: "flex", 
                flexDirection: "column",
                gap: "10px" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {msg.icon}
                <strong style={{ fontSize: "0.95rem" }}>{msg.title}</strong>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", flex: 1 }}>
                {msg.description}
              </p>
              
              <div style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
                <button
                  onClick={() => handleCopyPreset(msg.text, key)}
                  className="btn-primary"
                  style={{ 
                    flex: 1, 
                    padding: "6px 12px", 
                    fontSize: "0.85rem", 
                    background: copiedTemplate === key ? "var(--accent)" : "rgba(255,255,255,0.08)",
                    border: "1px solid var(--glass-border)",
                    color: copiedTemplate === key ? "white" : "var(--text-main)"
                  }}
                >
                  {copiedTemplate === key ? <Check size={14} /> : <Copy size={14} />}
                  {copiedTemplate === key ? " Copiado" : " Copiar"}
                </button>
                <button
                  onClick={() => handleSendPreset(msg.text)}
                  className="btn-primary"
                  style={{ 
                    flex: 1, 
                    padding: "6px 12px", 
                    fontSize: "0.85rem", 
                    background: "#25D366", 
                    color: "white" 
                  }}
                >
                  <Send size={14} /> Enviar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px", maxWidth: "450px", position: "relative" }}>
        <input
          type="text"
          placeholder="🔍 Buscar producto por nombre..."
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

      {/* Products Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {filtered.map((p) => (
          <div
            key={p.id}
            className="glass"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              position: "relative",
              background: "var(--glass-bg)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "var(--primary)",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {p.emprendimiento || "General"}
            </span>

            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.nombre}
                style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "180px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                Sin imagen disponible
              </div>
            )}

            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "600", marginBottom: "4px" }}>{p.nombre}</h3>
              <p style={{ color: "var(--accent)", fontWeight: "700", fontSize: "1.4rem" }}>
                S/ {p.precioVenta.toFixed(2)}
              </p>
            </div>

            <button
              onClick={() => handleOpenModal(p)}
              className="btn-primary"
              style={{
                marginTop: "auto",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "var(--accent)",
              }}
            >
              <MessageSquare size={16} /> Generar Mensaje
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ color: "var(--text-muted)", gridColumn: "span 4", textAlign: "center", padding: "40px" }}>
            No se encontraron productos para esta búsqueda.
          </p>
        )}
      </div>

      {/* WhatsApp Message Generator Modal */}
      {isModalOpen && selectedProduct && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass"
            style={{
              width: "100%",
              maxWidth: "960px",
              background: "#111827",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
              border: "1px solid var(--glass-border)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 25px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "700" }}>Generador de Mensaje de Venta</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "2px" }}>
                  Producto: <span style={{ color: "white", fontWeight: "600" }}>{selectedProduct.nombre}</span>
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: "50%",
                  color: "white",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "25px",
                padding: "25px",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {/* Left Column: Form & Adjustments */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <h4 style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                    1. Saludo / Cabecera (WhatsApp)
                  </h4>
                  <textarea
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid var(--glass-border)",
                      color: "white",
                      resize: "none",
                      outline: "none",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <h4 style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                    2. Introducción al Detalle
                  </h4>
                  <textarea
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid var(--glass-border)",
                      color: "white",
                      resize: "none",
                      outline: "none",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div>
                  <h4 style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                    3. Seleccionar Características a Incluir
                  </h4>
                  {selectedProduct.detalles && selectedProduct.detalles.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        maxHeight: "180px",
                        overflowY: "auto",
                        background: "rgba(0,0,0,0.2)",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {selectedProduct.detalles.map((d, index) => (
                        <label
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            padding: "6px",
                            borderRadius: "5px",
                            background: selectedDetails.includes(d) ? "rgba(59, 130, 246, 0.08)" : "transparent",
                            transition: "all 0.2s",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDetails.includes(d)}
                            onChange={() => handleToggleDetail(d)}
                            style={{ width: "auto", cursor: "pointer" }}
                          />
                          <span>{d}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Este producto no tiene características o detalles registrados en la base de datos.
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={includePrice}
                      onChange={(e) => setIncludePrice(e.target.checked)}
                      style={{ width: "auto", cursor: "pointer" }}
                    />
                    <span>Incluir precio/inversión (S/ {selectedProduct.precioVenta.toFixed(2)})</span>
                  </label>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                    4. Mensaje de Cierre / Call-To-Action
                  </h4>
                  <textarea
                    value={closing}
                    onChange={(e) => setClosing(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid var(--glass-border)",
                      color: "white",
                      resize: "none",
                      outline: "none",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Simulated Phone Preview */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "#0b141a", // WhatsApp Dark Mode BG color
                  borderRadius: "12px",
                  border: "1px solid #202c33",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {/* Phone Header Mock */}
                <div
                  style={{
                    background: "#202c33",
                    padding: "10px 15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderBottom: "1px solid #111b21",
                  }}
                >
                  <div
                    style={{
                      width: "35px",
                      height: "35px",
                      borderRadius: "50%",
                      background: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    👤
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", color: "#e9edef" }}>Cliente</h5>
                    <span style={{ fontSize: "0.75rem", color: "#8696a0" }}>en línea</span>
                  </div>
                </div>

                {/* Chat Area Mock */}
                <div
                  style={{
                    flex: 1,
                    padding: "15px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    backgroundImage: "radial-gradient(#152026 1px, transparent 0)", // Subtle grid pattern
                    backgroundSize: "20px 20px",
                  }}
                >
                  {/* Message Bubble Mock */}
                  <div
                    style={{
                      background: "#005c4b", // WhatsApp dark green bubble
                      color: "#e9edef",
                      padding: "12px 15px",
                      borderRadius: "10px 0 10px 10px",
                      maxWidth: "85%",
                      alignSelf: "flex-end",
                      position: "relative",
                      fontSize: "0.88rem",
                      lineHeight: "1.4",
                      boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatPreviewHtml(generateMessageText()),
                      }}
                    />
                    <div
                      style={{
                        textAlign: "right",
                        fontSize: "0.7rem",
                        color: "#8696a0",
                        marginTop: "5px",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <span>21:23</span>
                      <span style={{ color: "#53bdeb" }}>✓✓</span>
                    </div>
                  </div>
                </div>

                {/* Phone Footer Input Mock */}
                <div
                  style={{
                    background: "#202c33",
                    padding: "10px 15px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      background: "#2a3942",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "0.85rem",
                      color: "#8696a0",
                    }}
                  >
                    Mensaje de respuesta rápida...
                  </div>
                  <div
                    style={{
                      background: "#00a884",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <Send size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                gap: "15px",
                padding: "20px 25px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.15)",
              }}
            >
              <button
                type="button"
                onClick={handleCloseModal}
                className="btn-primary"
                style={{
                  background: "transparent",
                  border: "1px solid var(--glass-border)",
                  color: "white",
                  flex: 1,
                }}
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="btn-primary"
                style={{
                  background: copied ? "var(--accent)" : "rgba(255,255,255,0.1)",
                  border: "1px solid var(--glass-border)",
                  color: copied ? "white" : "var(--text-main)",
                  flex: 1.5,
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "¡Copiado!" : "Copiar Mensaje"}
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="btn-primary"
                style={{
                  background: "#25D366",
                  color: "white",
                  flex: 2,
                }}
              >
                <Send size={16} /> Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
