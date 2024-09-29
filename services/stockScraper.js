const axios = require('axios');
const cheerio = require('cheerio');

class StockScraper {
	constructor(stockName, url) {
		this.stockName = stockName;
		this.url = url;
	}

	async scrapeInfo() {
		try {
			const { data } = await axios.get(this.url);
			const $ = cheerio.load(data);           
			const price = $('div.value').first().text().trim().match(/[0-9+,.%-]+/)[0];
			const tipo = $('p').first().text().trim();
			const variacao = $('p.value').first().text().trim();
			const vmes = $('td:contains(Mês)').next().text().trim();
			const vano = $('td:contains("20")').next().text().trim();
			const percentage = $('div.percentage').first().text().trim().match(/[0-9+,.%-]+/)[0];
			const minimo = $('div.minimo').first().text().trim().match(/[0-9+,.%-]+/)[0];;
			const maximo = $('div.maximo').first().text().trim().match(/[0-9+,.%-]+/)[0];;
			const vol = $('div.volume').first().text().trim().match(/[0-9+,.%-]+/)[0];;
			let i = '';
			let cordia;
			let cormes;
			let corano;
			
			cormes = vmes.startsWith('-') ? 'bg-red-100' : 'bg-green-100';
			corano = vano.startsWith('-') ? 'bg-pink-100' : 'bg-blue-100';

			$('i.negative, i.positive').each(function () {
				const text = $(this).text().trim();
			
				// Usa operador ternário para simplificar a condição
				i = text === 'arrow_downward' 
					? '<span style="background-color: red; font-size: 20px;">&#x2B07;</span>' 
					: '<span style="background-color: green; font-size: 20px;">&#x2B06;</span>';
			
				cordia = text === 'arrow_downward' ? 'bg-red-600' : 'bg-green-600';								
			});
			return {
				name: this.stockName,
				price,
				tipo,
				variacao,
				vmes,
				vano,
				percentage,
				minimo,
				maximo,
				vol,
				i,
				cordia,
				cormes,
				corano,
				
			};
		} catch (error) {
			console.error(`Erro ao fazer o scraping do ${this.stockName}:`, error);
			return null;
		}
	}
}

module.exports = StockScraper;
