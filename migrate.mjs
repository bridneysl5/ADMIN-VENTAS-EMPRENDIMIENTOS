import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZ2irwGhTw0HdTNYULS49Rl1sKoSBu68E",
  authDomain: "admin-ventas-691ef.firebaseapp.com",
  projectId: "admin-ventas-691ef",
  storageBucket: "admin-ventas-691ef.firebasestorage.app",
  messagingSenderId: "926185738525",
  appId: "1:926185738525:web:09e57cf1992b15a33751f4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ALL_PRODUCTS = [
  { id: 1, name: 'Arreglo De Flores Con Vino', price: 130, category: ["Arreglos de Flores"], occasion: ["Para Ella","Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Arreglo de flores con vino.webp' },
  { id: 2, name: 'Arreglo De Flores Para Graduación 1', price: 140, category: ["Arreglos de Flores"], occasion: ["Graduación"], img: '/images/Graduacion/Arreglo de flores para  graduación  1.webp' },
  { id: 3, name: 'Arreglo De Flores Para Graduación 2', price: 150, category: ["Arreglos de Flores"], occasion: ["Graduación"], img: '/images/Graduacion/Arreglo de flores para  graduación  2.webp' },
  { id: 4, name: 'Arreglo De Flores Para Graduación 3', price: 160, category: ["Arreglos de Flores"], occasion: ["Graduación"], img: '/images/Graduacion/Arreglo de flores para  graduación  3.webp' },
  { id: 5, name: 'Arreglo Floral Spider Man', price: 79, category: ["Arreglos de Flores"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Arreglo floral Spider Man.webp' },
  { id: 6, name: 'Florero Superman - Batman', price: 40, category: ["Arreglos de Flores"], occasion: ["Aniversarios y Parejas","Para El","Para Ella"], img: '/images/Aniversario_Parejas/florero Superman - Batman.webp' },
  { id: 7, name: 'Box Hot Wheels', price: 70, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre","Para El"], img: '/images/DIA DEL PADRE - EL/box Hot wheels.webp', details: ['Dos hot wheels', 'Una caja de Ferrero Rocher', 'Snack de frutos secos o gomitas', 'Vaso hot wheels', 'Carta personalizada'] },
  { id: 8, name: 'Box Best Padre 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre"], isTop: true, img: '/images/DIA DEL PADRE - EL/box best padre 1.webp', details: ['Taza térmica personalizada', 'Postre', 'HotCakes con fruta o pan con pollo', 'Carta personalizada con tu mensaje especial', 'Chocolates Ferrero Rocher', 'Cuadro personalizado'] },
  { id: 9, name: 'Box Best Padre 2', price: 89, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/box best padre 2.webp', details: ['Jugo de maracuyá', 'Vaso con postre', 'Pan con pollo', 'Torta en frasco personalizado', 'Ensalada de frutas', 'Carta personalizada', 'Tequeños'] },
  { id: 10, name: 'Box Padre Star Wars 1', price: 65, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/box padre Star Wars 1.webp', details: ['Una libreta "Yo soy tu padre"', 'Un frasco de alfajores', 'Una taza personalizada', 'Una carta personalizada', 'Un snack personalizado', 'Queque o tequeños'] },
  { id: 11, name: 'Box Padre Star Wars 2', price: 85, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/box padre Star Wars 2.webp', details: ['2 fotos polaroid personalizadas', 'Una cerveza', 'Un snack', 'Queque o tequeños', 'Pringles', 'Carta personalizada'] },
  { id: 12, name: 'Box Padre Star Wars 3', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre"], isTop: true, img: '/images/DIA DEL PADRE - EL/box padre Star Wars 3.webp', details: ['Un jugo de maracuyá o chicha morada', 'Una taza personalizada Star Wars', 'Una dona', 'Chocolate Ferrero', 'Pan con pollo', 'Queque o tequeños', 'Carta personalizada'] },
  { id: 13, name: 'Box Padre Superheroe', price: 89, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/box padre Superheroe.webp', details: ['Una cerveza "Feliz día del padre"', 'Un vaso cervecero día del padre', 'Pringles', 'Kit de galletas', 'Ferrero Rocher', 'Caja de dulces'] },
  { id: 14, name: 'Box Padre Globos 1', price: 165, category: ["Sets y Gift Boxes","Tortas y Repostería"], occasion: ["Día del Padre","Cumpleaños"], img: '/images/DIA DEL PADRE - EL/box padre globos 1.webp', details: ['Una caja de Ferrero Rocher', 'Una copa con ensalada de frutas o postre', 'Bebida de maracuyá o chicha morada', 'Una bebida chocolatada', 'Tequeños', 'Flores', 'Torta personalizada día del padre', 'Carta personalizada'] },
  { id: 15, name: 'Box Padre Globos 2', price: 149, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre","Cumpleaños"], img: '/images/DIA DEL PADRE - EL/box padre globos 2.webp', details: ['Torta personalizada día del padre', 'Vaso cervecero día del padre', 'Un frasco con frutos secos o gomitas', '5 cervezas Corona', 'Una carta personalizada'] },
  { id: 16, name: 'Box Padre Personalizado 1', price: 75, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre","Para El"], img: '/images/DIA DEL PADRE - EL/box padre personalizado 1.webp', details: ['1 vino personalizado con foto', 'Un vaso térmico personalizado con sus nombres', 'Un cuadro personalizado', 'Caja de Ferrero Rocher', 'Una carta personalizada'] },
  { id: 17, name: 'Box Padre Personalizado 2', price: 59, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/box padre personalizado 2.webp', details: ['3 cervezas Corona', 'Un vaso térmico personalizado', 'Un frasco con frutos secos o gomitas', 'Un cuadro personalizado', 'Una carta personalizada'] },
  { id: 18, name: 'Taza Padre Personalizado 1', price: 20, category: ["Todos","Sets y Gift Boxes"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/taza  padre personalizado 1.webp', details: ['Taza con imagen del dibujo'] },
  { id: 19, name: 'Torta Padre 1', price: 69, category: ["Para El","Tortas y Repostería"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/torta padre 1.webp', details: ['Torta personalizada', '2 sabores a escoger (chocolate, vainilla)', '3 fotos polaroid'] },
  { id: 20, name: 'Toral Con Flores', price: 80, category: ["Tortas y Repostería","Arreglos de Flores"], occasion: ["Para Ella","Aniversarios y Parejas","Cumpleaños"], img: '/images/Para Ella/Toral con flores.webp' },
  { id: 21, name: 'Torta Floral 2', price: 85, category: ["Tortas y Repostería"], occasion: ["Para Ella","Cumpleaños"], img: '/images/Para Ella/Torta Floral 2.webp' },
  { id: 22, name: 'Torta Floral 3', price: 90, category: ["Tortas y Repostería"], occasion: ["Para Ella","Cumpleaños"], img: '/images/Para Ella/Torta Floral 3.webp' },
  { id: 23, name: 'Torta Floral 4', price: 95, category: ["Tortas y Repostería"], occasion: ["Para Ella","Cumpleaños"], img: '/images/Para Ella/Torta Floral 4.webp' },
  { id: 24, name: 'Torta Macetero 1', price: 100, category: ["Tortas y Repostería"], occasion: ["Para Ella","Cumpleaños"], img: '/images/Para Ella/Torta Macetero 1.webp' },
  { id: 25, name: 'Torta Mariposa', price: 105, category: ["Tortas y Repostería"], occasion: ["Para Ella","Cumpleaños"], img: '/images/Para Ella/Torta Mariposa.webp' },
  { id: 26, name: 'Torta Stich', price: 110, category: ["Tortas y Repostería"], occasion: ["Para Ella","Para El","Aniversarios y Parejas","Cumpleaños"], img: '/images/Para Ella/Torta Stich.webp' },
  { id: 27, name: 'Torta De Fresas', price: 115, category: ["Tortas y Repostería"], occasion: ["Para Ella","Cumpleaños","Aniversarios y Parejas"], img: '/images/Para Ella/Torta de fresas.webp' },
  { id: 28, name: 'Torta De Graduación', price: 120, category: ["Tortas y Repostería"], occasion: ["Graduación"], img: '/images/Graduacion/Torta de graduación.webp' },
  { id: 29, name: 'Torta Floral Intenso', price: 125, category: ["Tortas y Repostería"], occasion: ["Para Ella","Cumpleaños"], img: '/images/Para Ella/Torta floral Intenso.webp' },
  { id: 30, name: 'Torta Floral Arco', price: 130, category: ["Tortas y Repostería"], occasion: ["Para Ella","Cumpleaños"], img: '/images/Para Ella/Torta floral arco.webp' },
  { id: 31, name: 'Torta Floral 1', price: 135, category: ["Tortas y Repostería"], occasion: ["Para Ella","Cumpleaños"], img: '/images/Para Ella/torta floral 1.webp' },
  { id: 32, name: 'Cuadro Museo 3', price: 111, category: ["Cuadros"], occasion: ["Aniversarios y Parejas","Cumpleaños","Para Ella"], img: '/images/Aniversario_Parejas/cuadro museo 3.webp' },
  { id: 33, name: 'Cuadro Rosas', price: 92, category: ["Cuadros"], occasion: ["Aniversarios y Parejas","Para Ella"], img: '/images/Aniversario_Parejas/Cuadro Rosas.webp' },
  { id: 34, name: 'Estante En Miniatura', price: 107, category: ["Cuadros"], occasion: ["Día del Padre","Cumpleaños"], img: '/images/DIA DEL PADRE - EL/Estante en miniatura.webp', details: ['5 fotos personalizadas', 'Fecha personalizada', 'Libros personalizados'] },
  { id: 35, name: 'Imán Cuadro En Miniatura 1', price: 122, category: ["Cuadros"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/Imán cuadro en miniatura 1.webp', details: ['3 fotos personalizadas', 'Fecha o frase personalizada'] },
  { id: 36, name: 'Imán Cuadro En Miniatura 2', price: 117, category: ["Cuadros"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/Imán cuadro en miniatura 2.webp', details: ['3 fotos personalizadas', 'Libros personalizados'] },
  { id: 37, name: 'Imán Cuadro En Miniatura 3', price: 113, category: ["Cuadros"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/Imán cuadro en miniatura 3.webp' },
  { id: 38, name: 'Cuadro Flores 1', price: 107, category: ["Cuadros"], occasion: ["Aniversarios y Parejas","Para Ella","Cumpleaños"], img: '/images/Aniversario_Parejas/Cuadro flores 1.webp' },
  { id: 39, name: 'Cuadro Museo 1', price: 111, category: ["Cuadros"], occasion: ["Aniversarios y Parejas","Cumpleaños"], img: '/images/Aniversario_Parejas/cuadro museo 1.webp' },
  { id: 40, name: 'Cuadro Museo 2', price: 97, category: ["Cuadros"], occasion: ["Para Ella"], img: '/images/Para Ella/cuadro museo 2.webp' },
  { id: 41, name: 'Album', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Album.webp' },
  { id: 42, name: 'Coca Cola', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Coca Cola.webp' },
  { id: 43, name: 'Cuadro 1', price: 100, category: ["Cuadros","Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Cuadro 1.webp' },
  { id: 44, name: 'Cuadro 2', price: 100, category: ["Cuadros","Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Cuadro 2.webp' },
  { id: 45, name: 'Cuadro 3', price: 100, category: ["Cuadros","Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Cuadro 3.webp' },
  { id: 46, name: 'Desayuno 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas","Cumpleaños"], img: '/images/Aniversario_Parejas/Desayuno 1.webp' },
  { id: 47, name: 'Fifa', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas","Para El"], img: '/images/Aniversario_Parejas/Fifa.webp' },
  { id: 48, name: 'Hot Wheel 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas","Para El"], img: '/images/Aniversario_Parejas/Hot Wheel 1.webp' },
  { id: 49, name: 'Hot Wheel 2', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Hot Wheel 2.webp' },
  { id: 50, name: 'Hot Wheel 3', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Hot Wheel 3.webp' },
  { id: 51, name: 'Netflix', price: 100, category: ["Sets y Gift Boxes","Cuadros"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Netflix.webp' },
  { id: 52, name: 'Pintura y vino', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas","Para Ella","Para El","Cumpleaños"], img: '/images/Aniversario_Parejas/Pintura y vino.webp' },
  { id: 53, name: 'Ratatouille', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Ratatouille.webp' },
  { id: 54, name: 'Snoopy', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Aniversarios y Parejas"], img: '/images/Aniversario_Parejas/Snoopy.webp' },
  { id: 55, name: 'Temática  girasoles', price: 100, category: ["Arreglos de Flores"], occasion: ["Aniversarios y Parejas","Para Ella"], img: '/images/Aniversario_Parejas/temática  girasoles.webp' },
  { id: 56, name: 'Box padre google', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre"], img: '/images/DIA DEL PADRE - EL/box padre google.webp', details: ['Un carro hot wheels personalizado con foto', 'Una copa del mejor papá', 'Un llavero personalizado', 'Snack de dulces', 'Una carta personalizada'] },
  { id: 57, name: 'Box padre universitario', price: 50, category: ["Sets y Gift Boxes"], occasion: ["Día del Padre","Para El"], isCheap: true, img: '/images/DIA DEL PADRE - EL/box padre universitario.webp', details: ['Una cerveza personalizada', 'Dos fotos polaroid personalizadas', 'Pringles personalizado', 'Una carta personalizada'] },
  { id: 58, name: 'Desayuno Bienvenida 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/desayuno-bienvenida-1.webp' },
  { id: 59, name: 'Llegada Nacimiento 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-1.webp' },
  { id: 60, name: 'Llegada Nacimiento Abuelos 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-abuelos-1.webp' },
  { id: 61, name: 'Llegada Nacimiento Abuelos 2', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-abuelos-2.webp' },
  { id: 62, name: 'Llegada Nacimiento Abuelos 3', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-abuelos-3.webp' },
  { id: 63, name: 'Llegada Nacimiento Abuelos 4', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-abuelos-4.webp' },
  { id: 64, name: 'Llegada Nacimiento Abuelos 5', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-abuelos-5.webp' },
  { id: 65, name: 'Llegada Nacimiento Papa 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-papa-1.webp' },
  { id: 66, name: 'Llegada Nacimiento Tia 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-tia-1.webp' },
  { id: 67, name: 'Llegada Nacimiento Tios 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-tios-1.webp' },
  { id: 68, name: 'Llegada Nacimiento Tios 2', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/llegada-nacimiento-tios-2.webp' },
  { id: 69, name: 'Padrinos 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/padrinos-1.webp' },
  { id: 70, name: 'Regalo Bienvenida', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/regalo-bienvenida.webp' },
  { id: 71, name: 'Revelacion Mujer 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/revelacion-mujer-1.webp' },
  { id: 72, name: 'Revelacion Mujer 2', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/revelacion-mujer-2.webp' },
  { id: 73, name: 'Revelacion Varon 1', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/revelacion-varon-1.webp' },
  { id: 74, name: 'Revelacion Varon 2', price: 100, category: ["Sets y Gift Boxes"], occasion: ["Nacimientos"], img: '/images/Nacimientos/revelacion-varon-2.webp' },
];

async function migrate() {
  for (const p of ALL_PRODUCTS) {
    await addDoc(collection(db, "productos"), {
      nombre: p.name,
      precioVenta: p.price,
      costoReal: 0,
      costoReceta: 0,
      costoManoObra: 0,
      margen: 100,
      receta: [],
      imageUrl: p.img,
      emprendimiento: "Regalos",
      categoria: p.category || ["Todos"],
      ocasion: p.occasion || ["Todos"],
      detalles: p.details || []
    });
    console.log("Added", p.name);
  }
  console.log("Migration Complete!");
  process.exit(0);
}

migrate();
