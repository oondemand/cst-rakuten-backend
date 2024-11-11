exports.criarServicoParaExportacao = ({
  codEmpresa,
  codAutonomo,
  tipoDeDocumento,
  dataDeRealizacao,
  dataDePagamento,
  porcentualIss,
  valor,
  codCentroDeCustos,
}) => {
  const data = {
    codEmpresa,
    codAutonomo,
    tipoDeDocumento,
    dataDeRealizacao,
    dataDePagamento,
    porcentualIss,
    valor,
    codCentroDeCustos,
  };

  const campos = [
    "codEmpresa",
    "codAutonomo",
    "tipoDeDocumento",
    "dataDeRealizacao",
    "dataDePagamento",
    "porcentualIss",
    "valor",
    "codCentroDeCustos",
  ];

  return (
    campos
      .map((campo) => {
        return data[campo] ? `${data[campo]}` : "";
      })
      .join(";") + ";"
  );
};
