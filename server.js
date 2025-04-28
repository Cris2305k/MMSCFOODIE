const express = require('express');
const app = express();
const cors = require('cors');
const open = require('open').default; 
const usuariosRouter = require('./usuarios');
const pedidosRouter = require('./pedidos');

app.use(cors());
app.use(express.json());

app.use('/usuarios', usuariosRouter);
app.use('/pedidos', pedidosRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  await open(`http://localhost:${PORT}`); 
});