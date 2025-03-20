const Lista = require("../models/Lista");

const createLista = async (req, res) => {
  const { codigo } = req.body;
  try {
    const novaLista = new Lista({ codigo, valores: [] });
    await novaLista.save();
    res.status(201).json(novaLista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addItem = async (req, res) => {
  const { id } = req.params;
  const { valor } = req.body;
  try {
    const lista = await Lista.findById(id);
    if (!lista) return res.status(404).json({ error: "Lista não encontrada" });
    lista.valores.push({ valor });
    await lista.save();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeItem = async (req, res) => {
  const { id, itemId } = req.params;

  try {
    const lista = await Lista.findById(id);
    if (!lista) return res.status(404).json({ error: "Lista não encontrada" });
    lista.valores = lista.valores.filter((item) => item._id != itemId);
    await lista.save();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getListas = async (req, res) => {
  try {
    const listas = await Lista.aggregate([
      {
        $addFields: {
          valores: { $reverseArray: "$valores" },
        },
      },
    ]);
    res.json(listas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateItem = async (req, res) => {
  const { id } = req.params;
  const { itemId, valor } = req.body;

  try {
    const lista = await Lista.findById(id);
    if (!lista) return res.status(404).json({ error: "Lista não encontrada" });

    const index = lista.valores.findIndex((item) => item._id == itemId);

    if (index === -1)
      return res.status(404).json({ error: "Item não encontrado" });

    if (valor) lista.valores[index].valor = valor;

    await lista.save();
    res.json(lista);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

const getListaPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const lista = await Lista.findOne({ codigo });

    if (!lista) {
      return res.status(404).json({ mensagem: "Lista não encontrada" });
    }

    lista.valores = lista.valores.filter((item) => item.valor);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createLista,
  addItem,
  removeItem,
  getListas,
  updateItem,
  getListaPorCodigo,
};
