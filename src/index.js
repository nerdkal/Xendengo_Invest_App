const express = require('express');
const path = require('path');
const routes = require('./routes');
const db = require('mongoose');
require('dotenv').config();


const app = express();
const PORT =3000;
const auth=(process.env.auth);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

//Schema DB
const acoesSchema = db.Schema({
	ticker: String,
	url:	String,
	data: Date,
	update: { type: Date, default: Date.now() },

  });

const acoes = db.model("acoes", acoesSchema);
module.exports = acoes;


// Routes
app.use('/', routes);


app.post('/api/acoes', async (req, res) => {
	try {
		const acoes = await acoes.create(req.body);
		res.status(200).json(acoes);

	} catch (error) {
		res.status(500).json({message: error.message});
		
	}

} )

//DB connection & start server
//db.connect("mongodb+srv://"+auth+"@xndgdb.ywuzd.mongodb.net/ticker?retryWrites=true&w=majority&appName=XNDGDB")
db.connect("mongodb://"+auth+"@localhost:27017/ticker?retryWrites=true&w=majority")

	.then(() => {
		
		console.log("\x1b[1m\x1b[32m\x1b[5m", 'Sucesso!  Conectado ao DB!',"\x1b[0m");  //cyan
		app.listen(PORT, () => {
			 console.log('Servidor rodando em\x1b[1m\x1b[36m',`\x1b[4mhttp://localhost:${PORT}\x1b[0m`);
		});

	})
	.catch(() => {
		console.log("\x1b[1m\x1b[31m\x1b[5m", 'Falha!   Conexão ao DB falhou',"\x1b[0m");
	});






