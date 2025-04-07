const {
  parse,
  isValid,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} = require("date-fns");

const criarFiltroPorTipoDeCampo = ({ tipo, campo, valor }) => {
  const FILTRO_NUMERO = () => {
    const n = Number(valor);
    return !isNaN(n) ? { [campo]: n } : null;
  };

  const FILTRO_STRING = () => {
    // Função para escapar caracteres especiais do regex
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Remove símbolos
    const sanitized = valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^\w\s]/gi, ""); // Remove símbolos exceto espaços

    // Cria padrão combinando valor original e sanitizado
    const patterns = [
      escapeRegex(valor), // Valor original (escapado)
      escapeRegex(sanitized), // Valor sem símbolos (escapado)
    ]
      .filter(Boolean)
      .join("|"); // Remove valores vazios e junta com "OU"

    return {
      [campo]: {
        $regex: `(${patterns})`, // Busca por qualquer das versões
        $options: "i", // Case-insensitive
      },
    };
  };

  const FILTRO_DATE = () => {
    const operadores = [">", "<"];
    const operador = operadores.find((op) => valor.startsWith(op));
    const dataStr = operador ? valor.slice(1) : valor;

    // Helper para criar filtros de data com operadores
    const criarFiltro = (campo, valor, operador) => {
      const operadoresMongo = {
        ">": "$gte",
        "<": "$lte",
        "=": "$eq",
      };
      return { [campo]: { [operadoresMongo[operador || "="]]: valor } };
    };

    // Tentar analisar como data completa
    const parseDataCompleta = (str) => {
      const formatos = ["dd/MM/yyyy", "dd-MM-yyyy", "MM/yyyy", "MM-yyyy"];
      for (const fmt of formatos) {
        const data = parse(str, fmt, new Date());
        if (isValid(data)) {
          return data;
        }
      }
      return null;
    };

    // Casos especiais (dia, mês, ano isolado)
    // if (/^\d+$/.test(dataStr)) {
    //   const numero = parseInt(dataStr, 10);

    //   // Determinar o tipo (dia, mês ou ano)
    //   let tipo;
    //   if (dataStr.length === 4) {
    //     tipo = "ano";
    //   } else if (numero >= 1 && numero <= 31) {
    //     tipo = "dia";
    //   } else if (numero >= 1 && numero <= 12) {
    //     tipo = "mês";
    //   } else {
    //     return null;
    //   }

    //   console.log("tipo", tipo);

    //   // Criar expressão de filtro dinâmico
    //   const expressao = {
    //     dia: { $dayOfMonth: `$${campo}` },
    //     mês: { $month: `$${campo}` },
    //     ano: { $year: `$${campo}` },
    //   }[tipo];

    //   return {
    //     [`$${operador ? "expr" : "where"}`]: operador
    //       ? { [operador === ">" ? "$gte" : "$lte"]: [expressao, numero] }
    //       : { $eq: [expressao, numero] },
    //   };
    // }

    const data = parseDataCompleta(dataStr);
    if (!data) return null;

    const isMesAno = /^(\d{2}[\/-]\d{4})$/.test(dataStr);

    if (isMesAno) {
      const inicioMes = startOfMonth(data);
      const fimMes = endOfMonth(data);

      if (operador === ">") return criarFiltro(campo, inicioMes, operador);
      if (operador === "<") return criarFiltro(campo, fimMes, operador);
      return { [campo]: { $gte: inicioMes, $lte: fimMes } };
    }

    const inicioDia = startOfDay(data);
    const fimDia = endOfDay(data);

    if (operador === ">") return criarFiltro(campo, inicioDia, operador);
    if (operador === "<") return criarFiltro(campo, fimDia, operador);
    return { [campo]: { $gte: inicioDia, $lte: fimDia } };
  };

  const DEFAULT = () => {
    return { [campo]: valor };
  };

  const tipoFiltroMap = {
    Number: FILTRO_NUMERO,
    String: FILTRO_STRING,
    Date: FILTRO_DATE,
    default: DEFAULT,
  };

  return tipoFiltroMap[tipo] ? tipoFiltroMap[tipo]() : tipoFiltroMap.default();
};

const queryFiltros = ({ filtros, schema }) => {
  const query = {};
  for (const [campo, valor] of Object.entries(filtros)) {
    const campoSchema = schema.path(campo);
    console.log("Schema", campoSchema, campo, valor);

    if (!valor || !campoSchema) continue;

    const filtro = criarFiltroPorTipoDeCampo({
      campo,
      tipo: campoSchema?.instance,
      valor,
    });

    if (filtro) Object.assign(query, filtro);
  }
  return query;
};

const querySearchTerm = ({ searchTerm, schema, camposBusca = [] }) => {
  if (!searchTerm) return {};

  const orFilters = camposBusca
    .map((campo) => {
      const campoSchema = schema.path(campo);
      if (!campoSchema) return null;

      return criarFiltroPorTipoDeCampo({
        campo,
        tipo: campoSchema?.instance,
        valor: searchTerm,
      });
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
