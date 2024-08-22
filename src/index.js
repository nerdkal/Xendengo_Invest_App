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

// Routes
app.use('/', routes);

db.connect("mongodb+srv://"+auth+"@xndgdb.ywuzd.mongodb.net/?retryWrites=true&w=majority&appName=XNDGDB")
	.then(() => {
		
		console.log("\x1b[1m\x1b[32m\x1b[5m", 'Sucesso!  Conectado ao DB!',"\x1b[0m");  //cyan
		app.listen(PORT, () => {
			 console.log('Servidor rodando em\x1b[1m\x1b[36m',`\x1b[4mhttp://localhost:${PORT}\x1b[0m`);
		});

	})
	.catch(() => {
		console.log("\x1b[1m\x1b[31m\x1b[5m", 'Falha!   Conexão ao DB falhou',"\x1b[0m");
	});

