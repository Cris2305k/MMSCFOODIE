const express = require('express');
const router = express.Router();
const { crearPedido, obtenerPedidosPorUsuario } = require('./controllers');

// Crear un pedido
router.post('/', crearPedido);

// Obtener pedidos por usuario
router.get('/:usuarioId', obtenerPedidosPorUsuario);

module.exports = router;