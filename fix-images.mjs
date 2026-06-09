import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";

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

async function fixImages() {
  const q = query(collection(db, "productos"), where("emprendimiento", "==", "Regalos"));
  const snapshot = await getDocs(q);
  
  const baseUrl = "https://momentos-regalos.netlify.app";
  
  for (const productDoc of snapshot.docs) {
    const data = productDoc.data();
    if (data.imageUrl && data.imageUrl.startsWith("/images/")) {
      // encodeURI codifica espacios como %20 pero deja las / intactas
      const encodedPath = encodeURI(data.imageUrl);
      const absoluteUrl = baseUrl + encodedPath;
      
      await updateDoc(doc(db, "productos", productDoc.id), {
        imageUrl: absoluteUrl
      });
      console.log(`Updated image for: ${data.nombre}`);
    }
  }
  
  console.log("All images fixed!");
  process.exit(0);
}

fixImages();
