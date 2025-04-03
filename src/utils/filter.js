const queryFiltros = ({ filtros, schema }) => {
  const query = {};
  for (const [campo, valor] of Object.entries(filtros)) {
    if (!valor) continue;

    const campoSchema = schema.path(campo);
    if (campoSchema && campoSchema.options && campoSchema.options.enum) {
      query[campo] = valor;
      continue;
    }

    // Se for Number, converte e faz busca exata
    if (campoSchema?.instance === "Number") {
      const valorNumber = Number(valor);
      if (!isNaN(valorNumber)) {
        query[campo] = valorNumber;
      }
      continue;
    }

    // Se for String, aplica regex (busca parcial case-insensitive)
    if (campoSchema?.instance === "String") {
      query[campo] = { $regex: valor, $options: "i" };
      continue;
    }

    // Para outros tipos, aplica busca exata ou lógica específica
    query[campo] = valor;
  }
  return query;
};

const querySearchTerm = ({ searchTerm, schema, camposBusca = [] }) => {
  if (!searchTerm) return {};

  const orFilters = camposBusca
    .map((campo) => {
      const campoSchema = schema.path(campo);
      if (!campoSchema) return null;

      if (campoSchema.instance === "String") {
        return { [campo]: { $regex: searchTerm, $options: "i" } };
      }

      if (campoSchema.instance === "Number") {
        const valorNumber = Number(searchTerm);
        if (!isNaN(valorNumber)) {
          return { [campo]: valorNumber };
        }
        return null;
      }

      return null;
    })
    .filter(Boolean);

  return orFilters.length > 0 ? { $or: orFilters } : {};
};

const buildQuery = ({ filtros, searchTerm, schema, camposBusca = [] }) => {
  const specificFilters = queryFiltros({ filtros, schema });
  const globalFilter = querySearchTerm({ searchTerm, schema, camposBusca });
  return { $and: [specificFilters, ...(searchTerm ? [globalFilter] : [])] };
};

module.exports = { queryFiltros, querySearchTerm, buildQuery };
