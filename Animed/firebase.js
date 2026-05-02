import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD3G9kRDsTNoxWmnLx6kvwa05uCqSCOi2o",
    authDomain: "eldenbook-bb7eb.firebaseapp.com",
    projectId: "eldenbook-bb7eb",
    storageBucket: "eldenbook-bb7eb.firebasestorage.app",
    messagingSenderId: "694608115996",
    appId: "1:694608115996:web:073ea9969981e5eb7222d9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Capturar resultado al volver del redirect
getRedirectResult(auth).catch(err => console.error('Redirect error:', err));

// ─── AUTH ────────────────────────────────────────────────────────
export function loginConGoogle() {
    return signInWithPopup(auth, provider).catch(err => {
        console.error('Error al iniciar sesión:', err);
        alert('Error al iniciar sesión. Asegúrate de estar en http://localhost o un dominio autorizado.');
    });
}

export function cerrarSesion() {
    return signOut(auth);
}

export function onUsuarioCambia(callback) {
    return onAuthStateChanged(auth, callback);
}

// ─── FIRESTORE ───────────────────────────────────────────────────
export async function guardarBuildFirestore(buildData) {
    const user = auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const buildId = buildData.nombre.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now();
    const ref = doc(db, 'builds', buildId);

    await setDoc(ref, {
        ...buildData,
        uid: user.uid,
        autorNombre: user.displayName,
        autorFoto: user.photoURL,
        creadaEn: new Date().toISOString(),
        buildId
    });

    return buildId;
}

export async function obtenerMisBuilds() {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(collection(db, 'builds'), where('uid', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data());
}