const Ticket = require("../models/Ticket")
const {montarXmlPrestadores} = require("../services/integracaoRPAs/exportarPrestadores")

exports.exportarPrestadores = async (req, res) => {
  try {
    const { baseOmieId } = req.params;

    const ticketsComMesmoPrestador = await Ticket.aggregate([
      { 
          $match: { 
              baseOmie: baseOmieId, 
              etapa: "integracao-unico" 
          } 
      },
      { 
          $group: { 
              _id: "$prestador",  // Agrupando pelo campo 'prestador'
              count: { $sum: 1 }  // Contando tickets para cada 'prestador'
          } 
      },
      { 
          $match: { 
              count: { $gt: 1 }  // Filtra apenas prestadores com mais de um ticket
          } 
      },
      { 
          $limit: 1  // Limita o resultado a um registro para verificar apenas a existência
      }
  ]);
  

  if(ticketsComMesmoPrestador.length > 0){
    return res.status(409).json({message: "Erro ao exportar prestadores"})
  }

  const tickets = await Ticket.find({ baseOmie: baseOmieId, etapa: "integracao-unico" });
  
  console.log("->",tickets);

  await montarXmlPrestadores(tickets)
  
  

    // const ticketsComMesmoPrestador = tickets.prestador


    // if()

    
  } catch (error) {
    res.status(500).json({message: "Erro ao exportar prestadores"})
  }

  res.status(200).json({message: "A rota esta funcionando"})
}