// firebase.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Si vas a usar un archivo de credenciales JSON descargado de Firebase, usa cert()
const serviceAccount = require('./firebase-credentials.json');

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

// Exportar la base de datos Firestore
const db = getFirestore();

module.exports = { db };