const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        // console.log('Token ausente');
        return res.status(401).json({ error: 'Acesso não autorizado. Token ausente.' });
    }

    try {
        // console.log('Token recebido:', token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log('Token decodificado:', decoded);

        req.usuario = await Usuario.findById(decoded.id).select('-senha');
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        next();
    } catch (error) {
        console.log('Erro ao verificar o token:', error);
        return res.status(401).json({ error: 'Token inválido.' });
    }
};

module.exports = authMiddleware;