// backend/controllers/EmpresaController.js

const Empresa = require('../models/Empresa');

exports.registrarEmpresa = async (req, res) => {
    const { nome, cnpj, appKeyOmie, appSecretOmie, status } = req.body;
    try {
        const novaEmpresa = new Empresa({ nome, cnpj, appKeyOmie, appSecretOmie, status });
        await novaEmpresa.save();
        res.status(201).json(novaEmpresa);
    } catch (error) {
        res.status(400).json({ error: 'Erro ao registrar empresa' });
    }
};

exports.listarEmpresas = async (req, res) => {
    try {
        const empresas = await Empresa.find();
        res.json(empresas);
    } catch (error) {
        res.status(400).json({ error: 'Erro ao listar empresas' });
    }
};

exports.obterEmpresa = async (req, res) => {
    try {
        const empresa = await Empresa.findById(req.params.id);
        if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
        res.json(empresa);
    } catch (error) {
        res.status(400).json({ error: 'Erro ao obter empresa' });
    }
};

exports.atualizarEmpresa = async (req, res) => {
    const { nome, cnpj, appKeyOmie, appSecretOmie, status } = req.body;
    try {
        const empresa = await Empresa.findByIdAndUpdate(
            req.params.id,
            { nome, cnpj, appKeyOmie, appSecretOmie, status },
            { new: true }
        );
        if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
        res.json(empresa);
    } catch (error) {
        res.status(400).json({ error: 'Erro ao atualizar empresa' });
    }
};

exports.excluirEmpresa = async (req, res) => {
    try {
        const empresa = await Empresa.findByIdAndDelete(req.params.id);
        if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Erro ao excluir empresa' });
    }
};
