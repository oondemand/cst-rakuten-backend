const clienteService = require("../omie/clienteService");
const Prestador = require("../../models/Prestador");
const BaseOmie = require("../../models/BaseOmie");

const buscarPrestadorOmie = async ({ prestador, appKey, appSecret }) => {
  if (prestador?.codigo_cliente_omie) {
    const cliente = await clienteService.consultar(
      appKey,
      appSecret,
      prestador?.codigo_cliente_omie
    );

    return cliente;
  }

  if (prestador?.documento) {
    const clientes = await clienteService.pesquisarPorCNPJ(
      appKey,
      appSecret,
      prestador.documento
    );

    if (clientes && clientes.length > 0) {
      const cliente = clientes.find((item) => {
        return item?.caracteristicas?.some(
          (caracteristica) =>
            caracteristica.campo?.toLowerCase() === "sid" &&
            caracteristica.conteudo == prestador.sid
        );
      });

      return cliente;
    }
  }

  return null;
};

// const buscarPrestadorLocal = async ({ event }) => {
//   const baseOmie = await BaseOmie.findOne({ status: "ativo" });

//   let prestador = await Prestador.findOne({
//     codigo_cliente_omie: event.codigo_cliente_omie,
//   });

//   if (event?.cnpj_cpf) {
//     const cliente = await clienteService.consultar(
//       baseOmie.appKey,
//       baseOmie.appSecret,
//       event?.codigo_cliente_omie
//     );

//     console.log(cliente);

//     const sid = cliente?.caracteristicas?.find(
//       (item) => item?.campo?.toUpperCase() === "SID"
//     )?.conteudo;

//     if (!sid) return;

//     prestador = Prestador.findOne({
//       sid,
//     });
//   }

//   return prestador;
// };

const eventToPrestador = ({ event }) => {
  const documento = event?.cnpj_cpf
    ? Number(event.cnpj_cpf.replace(/[.\-\/]/g, ""))
    : null;

  const prestador = {
    nome: event?.razao_social,
    tipo:
      event?.exterior === "S"
        ? "ext"
        : event?.pessoa_fisica === "S"
          ? "pf"
          : "pj",
    documento,
    codigo_cliente_omie: event?.codigo_cliente_omie,
    dadosBancarios: {
      banco: event?.dadosBancarios?.codigo_banco,
      agencia: event?.dadosBancarios?.agencia,
      conta: event?.dadosBancarios?.conta_corrente,
    },
    email: event?.email,
    endereco: {
      cep: event?.cep,
      rua: event?.endereco,
      numero: event?.endereco_numero ? Number(event?.endereco_numero) : "",
      complemento: event?.complemento,
      cidade: event?.cidade,
      estado: event?.estado,
    },
  };

  return prestador;
};

module.exports = {
  buscarPrestadorOmie,
  // buscarPrestadorLocal,
  eventToPrestador,
};
