// -- DOCUMENTOS OBRIGATÓRIOS

const Prestador = require("../../models/Prestador");

// CPF
// Nome
// Data de nascimento
// CBO *
// Categoria SEFIP *
// Categoria eSocial * 

// Os dados devem ser separados por ; (ponto e vírgula) sempre devem existir todos os
// ponto e vírgula no layout mesmo que a informação não exista e ou não seja utilizada, o
// sistema vai importar salva exceção dos campos obrigatórios.

function unicoPrestadorXML({
  documento,             
  nome,                 
  cep,                   
  tipoLogradouro,       
  nomeDaRua,            
  numero,                
  complemento,          
  bairro,                
  codigoCidadeIBGE,      
  siglaEstado,            
  codigoDeAreaTelefonico, 
  telefoneFixo,           
  email,                
  dataNascimento,      
  codigoNascimentoIBGE, 
  estadoNascimento,     
  nomeMae,             
  grauInstrução,       
  sexo,                 
  estadoCivil,          
  rg,                  
  orgaoEmissorRG,       
  dataEmissaoRG,        
  estadoEmissaoRG,      
  numeroCarteiraTrabalho, 
  pisNis,               
  tipoResidencia,       
  codigoLocalizacao,    
  codigoInterno,        
  cnpjOuNumeroFiscal,   
  codigoAreaSubsetor,   
  numeroDependentes,    
  codigoAgencia,        
  dddOutroTelefone,
  informacaoDesconhecida,    
}) {
  const data = {
    documento,             
    nome,                 
    cep,                   
    tipoLogradouro,       
    nomeDaRua,            
    numero,                
    complemento,          
    bairro,                
    codigoCidadeIBGE,      
    siglaEstado,            
    codigoDeAreaTelefonico, 
    telefoneFixo,           
    email,                
    dataNascimento,      
    codigoNascimentoIBGE, 
    estadoNascimento,     
    nomeMae,             
    grauInstrução,       
    sexo,                 
    estadoCivil,          
    rg,                  
    orgaoEmissorRG,       
    dataEmissaoRG,        
    estadoEmissaoRG,      
    numeroCarteiraTrabalho, 
    pisNis,               
    tipoResidencia,       
    codigoLocalizacao,    
    codigoInterno,        
    cnpjOuNumeroFiscal,   
    codigoAreaSubsetor,   
    numeroDependentes,    
    codigoAgencia,        
    dddOutroTelefone,
    informacaoDesconhecida,     
  }

  const campos = [
      'documento',             
      'nome',                 
      'cep',                   
      'tipoLogradouro',       
      'nomeDaRua',            
      'numero',                
      'complemento',          
      'bairro',                
      'codigoCidadeIBGE',      
      'siglaEstado',            
      'codigoDeAreaTelefonico', 
      'telefoneFixo',           
      'campo-vazio-01',        
      'campo-vazio-02',             
      'email',                
      'dataNascimento',      
      'codigoNascimentoIBGE', // Pode estar errado creio que é o CBO
      'estadoNascimento',     
      'nomeMae',             
      'grauInstrução',        // Acho que pode ser Categoria SEFIP
      'sexo',                 
      'estadoCivil',          //  Categoria eSocial:
      'rg',                  
      'orgaoEmissorRG',       
      'dataEmissaoRG',        
      'estadoEmissaoRG',      
      'numeroCarteiraTrabalho', 
      'pisNis',               
      'tipoResidencia',       
      'codigoLocalizacao',    
      'campo-vazio-03',
      'codigoInterno',        
      'campo-vazio-04',       
      'campo-vazio-05',       
      'campo-vazio-06',       
      'campo-vazio-07'  ,     
      'cnpjOuNumeroFiscal',   
      'codigoAreaSubsetor',   
      'numeroDependentes',    
      'codigoAgencia',        
      'dddOutroTelefone',      
      'informacaoDesconhecida'            
  ];

  const xmlTemplate = campos.map(campo => {
      return data[campo] ? `${data[campo]}` : "";
  }).join(';');

  return xmlTemplate + ";"
}

exports.montarXmlPrestadores = async (tickets) => {
  let xml = ""

  for (const ticket of tickets) {
    const prestador = await Prestador.findById(ticket.prestador) 
    console.log(prestador);
    

    xml += unicoPrestadorXML({
      documento: prestador.documento, 
      bairro: prestador.bairro, 
      email: prestador.email, 
      nome: prestador.nome, cep: 
      prestador.endereco.cep})
      .concat("\n\n") 
  }

  console.log(xml);

  // console.log("XML gerado é igual ao exemplo fornecido ->", unicoPrestadorXML(dados) == exemploXmlGerado);
  
  

  return xml
}

// const dados = {
//   documento: '115.235.174-50',
//   nome: 'Humberto Baldissera',
//   cep: '89010-600',
//   tipoLogradouro: 'Rua',
//   nomeDaRua: 'Hermann Hering',
//   numero: '799',
//   complemento: 'SCI',
//   bairro: 'Bom Retiro',
//   codigoCidadeIBGE: '4202008',
//   siglaEstado: 'SC',
//   codigoDeAreaTelefonico: '47',
//   telefoneFixo: '3361-1000',
//   email: 'dp2@dp.com.br',
//   dataNascimento: '08/11/1985',
//   codigoNascimentoIBGE: '3551009',
//   estadoNascimento: 'SC',
//   nomeMae: 'Ana Baldissera',
//   grauInstrução: '07',      
//   sexo: 'M',                
//   estadoCivil: '2',         
//   rg: '49.752.289-5',
//   orgaoEmissorRG: 'SSP',
//   dataEmissaoRG: '19/01/2010',
//   estadoEmissaoRG: 'SC',
//   numeroCarteiraTrabalho: '116455',
//   pisNis: '410689870141',
//   tipoResidencia: '112',    
//   codigoLocalizacao: '46',   
//   codigoInterno: '73152',   
//   cnpjOuNumeroFiscal: '124.42580.97.9',
//   codigoAreaSubsetor: '3532-30', 
//   numeroDependentes: '13',   
//   codigoAgencia: '712',     
//   dddOutroTelefone: '20',    
//   informacaoDesconhecida: '20'           
// };

// const exemploXmlGerado = "115.235.174-50;Humberto Baldissera;89010-600;Rua;Hermann Hering;799;SCI;Bom Retiro;4202008;SC;47;3361-1000;;;dp2@dp.com.br;08/11/1985;3551009;SC;Ana Baldissera;07;M;2;49.752.289-5;SSP;19/01/2010;SC;116455;410689870141;112;46;;73152;;;;;124.42580.97.9;3532-30;13;712;20;20;"