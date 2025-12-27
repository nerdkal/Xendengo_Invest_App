const axios = require('axios');
const cheerio = require('cheerio');

class StockScraper {
  constructor(stockName, url) {
    this.stockName = stockName;
    this.url = url;
  }

  async scrapeInfo() {
    try {
      // API HG Brasil (adicione sua chave se tiver, senão mantém N/A)
      const financeResponse = await axios.get('https://api.hgbrasil.com/finance?key=SUA_CHAVE_AQUI');
      const financeData = financeResponse.data?.results || {};
      const ibovespaValue = financeData.stocks?.IBOVESPA?.points || 'N/A';
      const ibovespaVol = financeData.stocks?.IBOVESPA?.variation || 'N/A';
      const dolarValue = financeData.currencies?.USD?.buy || 'N/A';
      const dolarVol = financeData.currencies?.USD?.variation || 'N/A';
      const bitcoinValue = financeData.currencies?.BTC?.buy || 'N/A';
      const bitcoinVol = financeData.currencies?.BTC?.variation || 'N/A';
      const ifixValue = financeData.stocks?.IFIX?.points || 'N/A';
      const ifixVol = financeData.stocks?.IFIX?.variation || 'N/A';

      // Scraping da página da ação
      const { data } = await axios.get(this.url);
      const $ = cheerio.load(data);

      // Container principal dos cards de indicadores (o flex-wrap que você pegou)
      const indicators = $('div.flex.flex-wrap.gap-3.lg\\:gap-6 > div[data-ds-component="box-value"]');

      // Função auxiliar para pegar o valor de um indicador pelo texto do caption
      const getValue = (label) => {
        const card = indicators.filter((i, el) => $(el).find('span.im-mob-core-caption, span.im-web-core-caption').text().trim().includes(label));
        return card.find('span.im-mob-core-heading-3, span.im-web-core-heading-3').text().trim() || 'N/A';
      };

      // Variação diária (1d)
      const variacao = getValue('Variação (1d)') || '0,00%';

      // Variação mês atual
      const vmes = getValue('Variação (Mês Atual)') || 'N/A';

      // Variação YTD ou 1a (usamos YTD se existir, senão 1a)
      const vano = getValue('Variação (YTD)') || getValue('Variação (1a)') || 'N/A';

      // Min - Max (Dia)
      const minMaxDia = getValue('Min - Max (Dia)') || 'N/A';
      const minimo = minMaxDia.split('-')[0]?.trim() || 'N/A';
      const maximo = minMaxDia.split('-')[1]?.trim() || 'N/A';

      // Volume / Negócios
      const vol = getValue('Negócios') || 'N/A';

      // Preço atual (header principal - geralmente o maior strong ou span com R$)
      const price = $('span:contains("R$")').first().text().trim().replace('R$', '').trim() || 'N/A';

      // Tipo da ação (mantido do antigo, se ainda existir)
      const tipo = $('h3:contains("Tipo"), div:contains("Tipo") strong').text().trim() || 'N/A';

      // Setor de Atuação (link do setor)
      const setor = $('a[href^="/setor/"], a[href^="/acoes/setor/"]').first().text().trim() || 'N/A';

      // Ícone e cor da variação diária
      const variacaoCard = indicators.filter((i, el) => $(el).find('span.im-mob-core-caption').text().trim().includes('Variação (1d)'));
      const isPositive = variacaoCard.find('span').hasClass('text-success-pure');
      const isNegative = variacaoCard.find('span').hasClass('text-error-pure') || variacao.startsWith('-');

      let i = '<div class="up">&#x21ab; </div>';
      let cordia = 'bg-green-600';
      if (isNegative) {
        i = '<div class="down">&#x21af; </div>';
        cordia = 'bg-red-600';
      }

      const cormes = vmes.startsWith('-') ? 'bg-red-100' : 'bg-green-100';
      const corano = vano.startsWith('-') ? 'bg-pink-100' : 'bg-blue-100';
      const cormax = 'bg-gray-100';

      const percentage = variacao;

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
        cormax,
        setor,
        dolarValue,
        dolarVol,
        bitcoinValue: bitcoinValue !== 'N/A' && dolarValue !== 'N/A' 
          ? (bitcoinValue / dolarValue).toFixed(2) 
          : 'N/A',
        bitcoinVol,
        ifixValue,
        ifixVol,
        ibovespaValue,
        ibovespaVol
      };
    } catch (error) {
      console.error(`Erro ao fazer o scraping do ${this.stockName}:`, error.message);
      return null;
    }
  }
}

module.exports = StockScraper;
