const { exec } = require('child_process');

const Acoes = require('../models/mongoose');

// Função para a rota /lista
const lista  = async (req, res) => {
    try {
        const listaAcoes = await Acoes.find(); // Busca todos os documentos na coleção 'acoes'
        res.status(200).json(listaAcoes); // Retorna os documentos como JSON
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Rota para adicionar a ação do banco de dados
const adicionar = async (req, res) => {
    try {
        const { ticker, url, logo } = req.body;

        // Verificando se o ticker já existe no banco de dados
        const existingStock = await Acoes.findOne({ ticker });

        if (existingStock) {
            return res.json({ message: 'Ação já existe no banco de dados' });
        }

        // Adicionando a nova ação
        const newStock = new Acoes({ ticker, url, logo });
        await newStock.save();

        res.json({ message: 'Ação adicionada ao banco de dados com sucesso!' });

    } catch (error) {
        console.error('Erro ao adicionar a ação ao banco de dados:', error);
        res.status(500).json({ message: 'Erro ao adicionar a ação ao banco de dados' });
    }
};

// Rota para remover a ação do banco de dados
const remover = async (req, res) => {
	try {
		const id = req.params.id;
		await Acoes.findByIdAndDelete(id);
		res.json({ success: true });
	} catch (error) {
		console.error('Erro ao remover a ação:', error);
		res.status(500).json({ success: false, message: 'Erro ao remover a ação' });
	}
};


// Rota para pegar Link re ações
const pegar = async (req, res) => {
    const { stockName } = req.body;
    const url = `https://www.infomoney.com.br/${stockName.toLowerCase()}`;
    const urlogo = `https://br.tradingview.com/symbols/BMFBOVESPA-${stockName}`;

    exec(`curl -i ${url} 2>&1 | awk '/location/ {print $2}'`, (error, stdout) => {
        if (error) return res.json({ error: 'Erro ao buscar a URL da ação' });
        const location = stdout.match(/https[^\s]+/) ? `${stockName} ${stdout.match(/https[^\s]+/)[0]}` : 'Nenhuma URL de redirecionamento encontrada';

    exec(`curl -L -silent ${urlogo} | grep "logo." | cut -d"/" -f6 | grep png | sed 's/"//' | uniq`, (errorLogo, stdoutLogo) => {
        if (errorLogo) return res.json({ error: 'Erro ao buscar a URL do logo' });

        const logo = stdoutLogo ? `https://s3-symbol-logo.tradingview.com/${stdoutLogo.trim()}` : 'Nenhum logo encontrado';
        console.log('URLOGO É...', logo);
    res.json({ location, logo });
        });
    });
};


module.exports = {
    lista,
    adicionar,
    remover,
    pegar,
};