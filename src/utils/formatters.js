const path = require("node:path");

exports.criarNomePersonalizado = ({ nomeOriginal }) => {
  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}${path.extname(nomeOriginal)}`;

    return filename;
  } catch (error) {
    return "";
  }
};
