const { db } = require('./firebase');

exports.crearPedido = async (req, res) => {
  const pedido = req.body;

  try {
    const nuevoPedido = await db.collection('pedidos').add(pedido);
    res.status(201).json({ id: nuevoPedido.id, ...pedido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPedidosPorUsuario = async (req, res) => {
  const { usuarioId } = req.params;
  try {
    const pedidosSnapshot = await db.collection('pedidos')
      .where('usuarioId', '==', usuarioId)
      .get();

    const pedidos = pedidosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.crearUsuario = async (req, res) => {
  const usuario = req.body;

  try {
    const nuevoUsuario = await db.collection('usuarios').add(usuario);
    res.status(201).json({ id: nuevoUsuario.id, ...usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuariosSnapshot = await db.collection('usuarios').get();
    const usuarios = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};