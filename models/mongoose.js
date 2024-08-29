const mongoose = require('mongoose');

const acoesSchema = new mongoose.Schema({
	ticker: String,
	url: String,
	hora: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Acoes', acoesSchema);

