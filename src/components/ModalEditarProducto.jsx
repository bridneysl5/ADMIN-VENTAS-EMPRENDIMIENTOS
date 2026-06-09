import { useState, useEffect } from "react";
import { doc, updateDoc, onSnapshot, collection } from "firebase/firestore";
import { db } from "../firebase";
import { compressImageToBase64 } from "../utils";

export default function ModalEditarProducto({ isOpen, onClose, producto }) {
  const [insumos, setInsumos] = useState([]);
  
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [manoObra, setManoObra] = useState("");
  const [receta, setReceta] = useState([]);
  
  const [emprendimiento, setEmprendimiento] = useState("General");
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [ocasionesSeleccionadas, setOcasionesSeleccionadas] = useState([]);
  const [detallesList, setDetallesList] = useState([""]);
  const [imagen, setImagen] = useState(null);
  const [loading, setLoading] = useState(false);

  const categoriasAMostrar = emprendimiento === "Tortas" 
    ? ["Pasteles / Tortas", "Cupcakes", "Bocaditos"] 
    : ["Arreglos de Flores", "Sets y Gift Boxes", "Tortas y Repostería", "Cuadros", "Desayunos", "Otros"];

  const ocasionesAMostrar = emprendimiento === "Tortas"
    ? ["Cumpleaños", "Aniversarios", "Infantiles", "K-pop", "Aesthetics", "San Valentín", "Día de la Madre"]
    : ["Para Ella", "Para El", "Aniversarios y Parejas", "Graduación", "Día del Padre", "Día de la Madre", "Cumpleaños", "Nacimientos", "San Valentín"];

  const [selectedInsumo, setSelectedInsumo] = useState("");
  const [cantInsumo, setCantInsumo] = useState("");

  useEffect(() => {
    if(isOpen) {
      const unsubInsumos = onSnapshot(collection(db, "insumos"), (snapshot) => {
        const docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
        setInsumos(docs);
      });
      return () => unsubInsumos();
    }
  }, [isOpen]);

  useEffect(() => {
    if (producto && isOpen) {
      setNombre(producto.nombre || "");
      setPrecio(producto.precioVenta || "");
      setManoObra(producto.costoManoObra || "");
      setReceta(producto.receta || []);
      setEmprendimiento(producto.emprendimiento || "General");
      
      setCategoriasSeleccionadas(Array.isArray(producto.categoria) ? producto.categoria : (producto.categoria ? producto.categoria.split(',').map(c => c.trim()) : []));
      setOcasionesSeleccionadas(Array.isArray(producto.ocasion) ? producto.ocasion : (producto.ocasion ? producto.ocasion.split(',').map(o => o.trim()) : []));
      setDetallesList(Array.isArray(producto.detalles) && producto.detalles.length > 0 ? producto.detalles : [""]);
      setImagen(null);
    }
  }, [producto, isOpen]);

  if (!isOpen || !producto) return null;

  const addToReceta = () => {
    const ins = insumos.find(i => i.id === selectedInsumo);
    if(ins && cantInsumo > 0) {
      setReceta([...receta, { idInsumo: ins.id, nombre: ins.nombre, cant: parseFloat(cantInsumo), costoUnitario: ins.costoMenor }]);
      setCantInsumo("");
    }
  };

  const removeReceta = (idx) => {
    setReceta(receta.filter((_, i) => i !== idx));
  };

  const costoReceta = receta.reduce((acc, item) => acc + (item.cant * item.costoUnitario), 0);
  const costoManoObra = parseFloat(manoObra) || 0;
  const costoReal = costoReceta + costoManoObra;
  
  const precioVal = parseFloat(precio) || 0;
  const ganancia = precioVal - costoReal;
  const margen = precioVal > 0 ? (ganancia / precioVal) * 100 : 0;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let imageUrl = producto.imageUrl || "";
      if (imagen) {
        try {
          imageUrl = await compressImageToBase64(imagen);
        } catch (err) {
          console.error("Error al comprimir la imagen:", err);
          throw new Error("No se pudo procesar la imagen.");
        }
      }

      const detallesArray = detallesList.map(d => d.trim()).filter(d => d);
      const catArray = categoriasSeleccionadas;
      const ocArray = ocasionesSeleccionadas;

      await updateDoc(doc(db, "productos", producto.id), {
        nombre, 
        precioVenta: precioVal, 
        costoReal, 
        costoReceta, 
        costoManoObra, 
        margen, 
        receta, 
        imageUrl,
        emprendimiento,
        categoria: catArray,
        ocasion: ocArray,
        detalles: detallesArray
      });
      
      onClose();
    } catch (globalError) {
      console.error("Error general al guardar:", globalError);
      alert("Error al guardar: " + globalError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '700px', background: 'var(--bg-color)', padding: '30px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Editar Producto Completo</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
            <h4 style={{ marginBottom: "10px", color: "var(--text-main)" }}>Destino del Producto</h4>
            <div>
              <label>Emprendimiento</label>
              <select value={emprendimiento} onChange={e=>setEmprendimiento(e.target.value)} style={{ marginTop: "5px" }}>
                <option value="General">Venta General (Punto de Venta Local)</option>
                <option value="Regalos">Web de REGALOS</option>
                <option value="Tortas">Web de TORTAS</option>
              </select>
            </div>
            
            {emprendimiento !== "General" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
                <div className="card" style={{ background: "rgba(0,0,0,0.2)", padding: "10px" }}>
                  <h4>Categorías</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                    {categoriasAMostrar.map(cat => (
                      <label key={cat} style={{ 
                        cursor: "pointer", fontSize: "0.9em", display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "rgba(0,0,0,0.2)", padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--glass-border)", transition: "all 0.2s"
                      }}>
                        <span>{cat}</span>
                        <input 
                          type="checkbox" 
                          checked={categoriasSeleccionadas.includes(cat)}
                          onChange={(e) => {
                            if(e.target.checked) setCategoriasSeleccionadas([...categoriasSeleccionadas, cat]);
                            else setCategoriasSeleccionadas(categoriasSeleccionadas.filter(c => c !== cat));
                          }}
                          style={{ margin: 0, transform: "scale(1.2)", cursor: "pointer" }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ background: "rgba(0,0,0,0.2)", padding: "10px" }}>
                  <h4>Ocasiones</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                    {ocasionesAMostrar.map(oc => (
                      <label key={oc} style={{ 
                        cursor: "pointer", fontSize: "0.9em", display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "rgba(0,0,0,0.2)", padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--glass-border)", transition: "all 0.2s"
                      }}>
                        <span>{oc}</span>
                        <input 
                          type="checkbox" 
                          checked={ocasionesSeleccionadas.includes(oc)}
                          onChange={(e) => {
                            if(e.target.checked) setOcasionesSeleccionadas([...ocasionesSeleccionadas, oc]);
                            else setOcasionesSeleccionadas(ocasionesSeleccionadas.filter(o => o !== oc));
                          }}
                          style={{ margin: 0, transform: "scale(1.2)", cursor: "pointer" }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ background: "rgba(0,0,0,0.2)", padding: "10px", marginTop: "15px", gridColumn: "span 2" }}>
                  <h4>Detalles del Producto (Ej: Elementos de la caja)</h4>
                  {detallesList.map((det, index) => (
                    <div key={index} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <input 
                        type="text" 
                        placeholder={`Detalle ${index + 1}`} 
                        value={det} 
                        onChange={(e) => {
                          const newList = [...detallesList];
                          newList[index] = e.target.value;
                          setDetallesList(newList);
                        }} 
                        style={{ flex: 1, padding: "8px", borderRadius: "5px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.1)", color: "white" }}
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          const newList = [...detallesList];
                          newList.splice(index, 1);
                          setDetallesList(newList);
                        }}
                        style={{ background: "#ff4757", color: "white", border: "none", borderRadius: "5px", padding: "0 15px", cursor: "pointer" }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setDetallesList([...detallesList, ""])}
                    style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: "5px", padding: "8px 15px", cursor: "pointer", marginTop: "10px" }}
                  >
                    + Añadir Otro Detalle
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label>Nombre del Producto</label>
            <input required value={nombre} onChange={e=>setNombre(e.target.value)} />
          </div>
          
          <div>
            <label>Cambiar Imagen (Dejar vacío para conservar la actual)</label>
            <input type="file" accept="image/*" onChange={e=>setImagen(e.target.files[0])} />
            {producto.imageUrl && !imagen && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>Imagen actual guardada.</p>}
          </div>

          <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px" }}>
            <h4>Modificar Receta</h4>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <select value={selectedInsumo} onChange={e=>setSelectedInsumo(e.target.value)}>
                <option value="">-- Añadir Insumo --</option>
                {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre} (en {i.unidadMenor.split(' ')[0]})</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Cant" value={cantInsumo} onChange={e=>setCantInsumo(e.target.value)} style={{ width: "100px" }} />
              <button type="button" onClick={addToReceta} className="btn-primary">+</button>
            </div>
            <ul style={{ marginTop: "15px", listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
              {receta.map((r, idx) => (
                <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                  <span>{r.cant} x {r.nombre}</span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span>S/ {(r.cant * r.costoUnitario).toFixed(2)}</span>
                    <button type="button" onClick={() => removeReceta(idx)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "16px" }}>&times;</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label>Mano de Obra (S/)</label>
              <input type="number" step="0.01" value={manoObra} onChange={e=>setManoObra(e.target.value)} />
            </div>
            <div>
              <label>Precio de Venta Final (S/)</label>
              <input required type="number" step="0.1" value={precio} onChange={e=>setPrecio(e.target.value)} />
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="button" onClick={onClose} className="btn-primary" style={{ flex: 1, background: "transparent", border: "1px solid var(--glass-border)" }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2 }}>
              {loading ? "Guardando Cambios..." : "Guardar Cambios"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
