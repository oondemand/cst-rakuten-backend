const processarXmlNfse = async (xmlObject) => {
    try {
        console.log("Processando XML da NFSe...");

        if (typeof xmlObject !== 'object') {
            throw new Error('O XML não foi convertido corretamente em um objeto.');
        }

        // Monta o objeto NFSe, verificando a existência de cada campo antes de tentar acessá-lo
        const nfseData = {
            informacoesNfse: {
                numero: xmlObject.compnfse?.nfse?.infnfse?.numero || null,
                codigoVerificacao: xmlObject.compnfse?.nfse?.infnfse?.codigoverificacao || null,
                dataEmissao: xmlObject.compnfse?.nfse?.infnfse?.dataemissao || null,
                valorCredito: xmlObject.compnfse?.nfse?.infnfse?.valorcredito || null,
                prestadorServico: {
                    identificacaoPrestador: {
                        cpfCnpj: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.identificacaoprestador?.cpfcnpj?.cnpj || null,
                        inscricaoMunicipal: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.identificacaoprestador?.inscricaomunicipal || null,
                    },
                    razaoSocial: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.razaosocial || null,
                    endereco: {
                        endereco: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.endereco?.endereco || null,
                        numero: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.endereco?.numero || null,
                        complemento: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.endereco?.complemento || null,
                        bairro: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.endereco?.bairro || null,
                        codigoMunicipio: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.endereco?.codigomunicipio || null,
                        uf: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.endereco?.uf || null,
                        cep: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.endereco?.cep || null,
                    },
                    contato: {
                        email: xmlObject.compnfse?.nfse?.infnfse?.prestadorservico?.contato?.email || null,
                    },
                },
                declaracaoPrestacaoServico: {
                    competencia: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.competencia || null,
                    servico: {
                        valores: {
                            aliquota: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.servico?.valores?.aliquota || null,
                            valorIss: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.servico?.valores?.valoriss || null,
                            valorServicos: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.servico?.valores?.valorservicos || null,
                        },
                        issRetido: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.servico?.issretido || null,
                        itemListaServico: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.servico?.itemlistaservico || null,
                        codigoTributacaoMunicipio: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.servico?.codigotributacaomunicipio || null,
                        discriminacao: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.servico?.discriminacao || null,
                        codigoMunicipio: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.servico?.codigomunicipio || null,
                        municipioIncidencia: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.servico?.municipioincidencia || null,
                    },
                    prestador: {
                        cpfCnpj: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.prestador?.cpfcnpj?.cnpj || null,
                        inscricaoMunicipal: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.prestador?.inscricaomunicipal || null,
                    },
                    tomador: {
                        identificacaoTomador: {
                            cpfCnpj: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.identificacaotomador?.cpfcnpj?.cnpj || null,
                            inscricaoMunicipal: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.inscricaomunicipal || null,
                        },
                        razaoSocial: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.razaosocial || null,
                        endereco: {
                            endereco: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.endereco?.endereco || null,
                            numero: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.endereco?.numero || null,
                            complemento: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.endereco?.complemento || null,
                            bairro: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.endereco?.bairro || null,
                            codigoMunicipio: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.endereco?.codigomunicipio || null,
                            uf: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.endereco?.uf || null,
                            cep: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.endereco?.cep || null,
                        },
                        contato: {
                            email: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.tomador?.contato?.email || null,
                        },
                    },
                    optanteSimplesNacional: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.optantesimplesnacional || null,
                    incentivoFiscal: xmlObject.compnfse?.nfse?.infnfse?.declaracaoprestacaoservico?.infdeclaracaoprestacaoservico?.incentivofiscal || null,
                },
            },
        };

        console.log("NFSe Processada:", nfseData);
        return nfseData;
    } catch (error) {
        console.error("Erro ao processar NFSe:", error);
        throw new Error("Falha ao processar o XML");
    }
};

module.exports = processarXmlNfse;