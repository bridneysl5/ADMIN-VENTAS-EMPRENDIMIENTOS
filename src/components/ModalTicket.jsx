import React, { useState } from "react";
import html2canvas from "html2canvas";

export default function ModalTicket({ ticket, onClose }) {
  if (!ticket) return null;

  const handleDownloadImage = async () => {
    try {
      const element = document.getElementById("ticket-print-area");
      const canvas = await html2canvas(element, { backgroundColor: "#ffffff" });
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ticket-${ticket.pedidoId}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error(err);
      alert("Error al descargar la imagen del ticket.");
    }
  };

  const handleShareWhatsApp = async () => {
    if (!ticket.detalles?.telefono) return alert("No ingresaste un número de WhatsApp para este pedido.");
    
    try {
      const element = document.getElementById("ticket-print-area");
      const canvas = await html2canvas(element, { backgroundColor: "#ffffff" });
      
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `ticket-${ticket.pedidoId}.png`, { type: "image/png" });
        
        // Descargar la imagen y abrir WhatsApp
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ticket-${ticket.pedidoId}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Formatear el teléfono (quitar espacios, + etc)
        let phone = ticket.detalles.telefono.replace(/[^0-9]/g, '');
        if (!phone.startsWith("51") && phone.length === 9) {
          phone = "51" + phone; // Asumir Perú si son 9 dígitos
        }

        let msg = `*TICKET DE PEDIDO: ${ticket.pedidoId}*%0A¡Hola! Tu ticket de compra se acaba de generar. Por favor, adjunta la imagen descargada en este chat para confirmar.%0A`;
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
      }, "image/png");
    } catch (err) {
      console.error(err);
      alert("Error al generar la imagen del ticket.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ width: "90%", maxWidth: "400px", textAlign: "center" }}>
        
        <div id="ticket-print-area" style={{ padding: "20px", background: "white", color: "black", borderRadius: "10px", textAlign: "left", fontFamily: "monospace" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: "0 0 5px 0" }}>TICKET DE PEDIDO</h2>
            <h3 style={{ margin: 0, color: "#333" }}>ID: {ticket.pedidoId}</h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem" }}>{new Date().toLocaleString()}</p>
          </div>

          <div style={{ borderBottom: "1px dashed #ccc", margin: "10px 0" }}></div>

          <table style={{ width: "100%", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Cant</th>
                <th>Producto</th>
                <th style={{ textAlign: "right" }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {ticket.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.qty}x</td>
                  <td>{item.nombre}</td>
                  <td style={{ textAlign: "right" }}>S/ {(item.qty * item.precioVenta).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderBottom: "1px dashed #ccc", margin: "10px 0" }}></div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span>Subtotal:</span>
            <span>S/ {(ticket.total - ticket.detalles.costoDelivery).toFixed(2)}</span>
          </div>
          
          {ticket.detalles.incluyeDelivery && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span>Delivery:</span>
              <span>S/ {ticket.detalles.costoDelivery.toFixed(2)}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "1.2rem", marginTop: "10px" }}>
            <span>TOTAL:</span>
            <span>S/ {ticket.total.toFixed(2)}</span>
          </div>

          <div style={{ borderBottom: "1px dashed #ccc", margin: "15px 0" }}></div>

          {(ticket.detalles.direccion || ticket.detalles.comentarios) && (
            <div style={{ fontSize: "0.9rem" }}>
              <strong>Datos de Envío:</strong><br/>
              {ticket.detalles.direccion && <span>Dir: {ticket.detalles.direccion}<br/></span>}
              {ticket.detalles.comentarios && <span>Notas: {ticket.detalles.comentarios}</span>}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem" }}>
            <strong>¡Gracias por tu compra!</strong><br/>
            Guarda tu ID <strong>{ticket.pedidoId}</strong> para darle seguimiento a tu pedido.
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "10px 20px" }}>Cerrar</button>
          <button onClick={handleDownloadImage} className="btn-primary" style={{ padding: "10px 20px", background: "#6366f1", border: "none" }}>🖼️ Descargar (PNG)</button>
          <button onClick={handleShareWhatsApp} className="btn-primary" style={{ padding: "10px 20px", background: "#25D366", border: "none" }}>📱 Enviar Ticket (WhatsApp)</button>
        </div>
      </div>
    </div>
  );
}
