const express = require('express');
const router = express.Router();
const { crearUsuario, obtenerUsuarios } = require('./controllers');

// Crear un nuevo usuario
router.post('/', crearUsuario);

// Obtener todos los usuarios
router.get('/', obtenerUsuarios);

module.exports = router;