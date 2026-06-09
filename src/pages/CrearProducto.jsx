import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { compressImageToBase64 } from "../utils";

export default function CrearProducto() {
  const [insumos, setInsumos] = useState([]);
  
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [manoObra, setManoObra] = useState("");
  const [imagen, setImagen] = useState(null);
  const [receta, setReceta] = useState([]);
  
  // Nuevos campos multi-emprendimiento
  const [emprendimiento, setEmprendimiento] = useState("General");
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [ocasionesSeleccionadas, setOcasionesSeleccionadas] = useState([]);
  const [detallesList, setDetallesList] = useState([""]);
  
  const CATEGORIAS_OPCIONES = ["Arreglos de Flores", "Sets y Gift Boxes", "Tortas y Repostería", "Cuadros", "Desayunos", "Otros"];
  const OCASIONES_OPCIONES = ["Para Ella", "Para El", "Aniversarios y Parejas", "Graduación", "Día del Padre", "Día de la Madre", "Cumpleaños", "Nacimientos", "San Valentín"];
  
  const [selectedInsumo, setSelectedInsumo] = useState("");
  const [cantInsumo, setCantInsumo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubInsumos = onSnapshot(collection(db, "insumos"), (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      setInsumos(docs);
    });
    return () => unsubInsumos();
  }, []);

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

  const handleAddProd = async (e) => {
    e.preventDefault();
    if(receta.length === 0) return alert("Agrega insumos a la receta");
    setLoading(true);
    
    try {
      let imageUrl = "";
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

      await addDoc(collection(db, "productos"), {
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
      
      setNombre(""); setPrecio(""); setManoObra(""); setReceta([]); setImagen(null);
      setCategoriasSeleccionadas([]); setOcasionesSeleccionadas([]); setDetallesList([""]);
      alert("¡Producto creado con éxito!");
    } catch (globalError) {
      console.error("Error al guardar producto:", globalError);
      alert("Error al guardar: " + globalError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", width: "100%", paddingBottom: "50px" }}>
      <h2 style={{ marginBottom: "20px" }}>Crear Nuevo Producto</h2>
      
      <div className="glass" style={{ padding: "30px" }}>
        <form onSubmit={handleAddProd} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
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
                    {CATEGORIAS_OPCIONES.map(cat => (
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
                    {OCASIONES_OPCIONES.map(oc => (
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
              </div>
            )}
            
            {emprendimiento !== "General" && (
              <div className="card" style={{ background: "rgba(0,0,0,0.2)", padding: "10px", marginTop: "15px" }}>
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
            )}
          </div>

          <div>
            <label>Nombre del Producto</label>
            <input required value={nombre} onChange={e=>setNombre(e.target.value)} />
          </div>
          
          <div>
            <label>Imagen del Producto (Recomendado para la Web)</label>
            <input type="file" accept="image/*" onChange={e=>setImagen(e.target.files[0])} />
          </div>

          <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px" }}>
            <h4>Armar Receta / Materiales Usados</h4>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <select value={selectedInsumo} onChange={e=>setSelectedInsumo(e.target.value)}>
                <option value="">-- Insumo --</option>
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
              <label>Precio Final Venta (S/)</label>
              <input required type="number" step="0.1" value={precio} onChange={e=>setPrecio(e.target.value)} />
            </div>
          </div>

          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <p style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              Costo de Insumos: <strong style={{ color: "var(--text-muted)" }}>S/ {costoReceta.toFixed(2)}</strong>
            </p>
            <p style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              Costo Total (Inc. Mano de Obra): <strong style={{ color: "var(--danger)" }}>S/ {costoReal.toFixed(2)}</strong>
            </p>
            <p style={{ display: "flex", justifyContent: "space-between" }}>
              Margen de Ganancia: <strong style={{ color: ganancia > 0 ? "var(--accent)" : "var(--danger)" }}>{margen.toFixed(1)}% (S/ {ganancia.toFixed(2)})</strong>
            </p>
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "15px", fontSize: "1.1rem" }}>
            {loading ? "Guardando..." : "Guardar Producto en la Base de Datos"}
          </button>
        </form>
      </div>
    </div>
  );
}
