const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical']
});

class YahooFinanceService {
  async getStockInfo(ticker) {
    try {
      const symbol = ticker.endsWith('.SA') ? ticker : `${ticker}.SA`;

      // 🔹 Quote (preço, variações, volume etc)
      const quote = await yahooFinance.quote(symbol);

      // 🔹 Summary (SETOR VEM DAQUI)
      let setor = 'N/A';
      try {
        const summary = await yahooFinance.quoteSummary(symbol, {
          modules: ['assetProfile']
        });
        setor = summary?.assetProfile?.sector || 'N/A';
      } catch (_) {}

      const today = new Date();
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      const [historyMonth, historyYear] = await Promise.all([
        yahooFinance.historical(symbol, {
          period1: oneMonthAgo,
          period2: today,
          interval: '1d'
        }),
        yahooFinance.historical(symbol, {
          period1: oneYearAgo,
          period2: today,
          interval: '1d'
        })
      ]);

      const firstMonthPrice = historyMonth?.[0]?.close ?? quote.regularMarketPrice;
      const firstYearPrice = historyYear?.[0]?.close ?? quote.regularMarketPrice;

      const vmes = ((quote.regularMarketPrice - firstMonthPrice) / firstMonthPrice * 100).toFixed(2);
      const vano = ((quote.regularMarketPrice - firstYearPrice) / firstYearPrice * 100).toFixed(2);

      const getColorClass = (val) =>
        val > 0 ? 'bg-green-600' : val < 0 ? 'bg-red-600' : 'bg-gray-600';

      return {
        price: quote.regularMarketPrice?.toFixed(2) || 'N/A',
        percentage: quote.regularMarketChangePercent
          ? `${quote.regularMarketChangePercent.toFixed(2)}%`
          : 'N/A',
        cordia: getColorClass(quote.regularMarketChangePercent || 0),
        vmes: `${vmes}%`,
        cormes: getColorClass(parseFloat(vmes)),
        vano: `${vano}%`,
        corano: getColorClass(parseFloat(vano)),
        minimo: quote.fiftyTwoWeekLow?.toFixed(2) || 'N/A',
        maximo: quote.fiftyTwoWeekHigh?.toFixed(2) || 'N/A',
        vol: quote.regularMarketVolume?.toLocaleString() || 'N/A',
        setor, // ✅ AGORA FUNCIONA
        tipo: quote.quoteType === 'EQUITY' ? 'Ação' : 'Fundo/Outro',
        i: ''
      };
    } catch (err) {
      console.error(`Erro ao buscar ${ticker}:`, err.message);
      return {
        price: 'Erro',
        percentage: 'N/A',
        cordia: 'bg-gray-600',
        vmes: 'N/A',
        cormes: 'bg-gray-600',
        vano: 'N/A',
        corano: 'bg-gray-600',
        minimo: 'N/A',
        maximo: 'N/A',
        vol: 'N/A',
        setor: 'N/A',
        tipo: 'N/A',
        i: ''
      };
    }
  }

  async getGlobalIndices() {
    try {
      const [ibov, dolar, btc, ifix] = await Promise.all([
        yahooFinance.quote('^BVSP'),
        yahooFinance.quote('USDBRL=X'),
        yahooFinance.quote('BTC-USD'),
        yahooFinance.quote('IFIX.SA').catch(() => null)
      ]);

      return {
        ibovespaValue: ibov?.regularMarketPrice?.toFixed(0) || 'N/A',
        ibovespaVol: ibov?.regularMarketChangePercent
          ? `${ibov.regularMarketChangePercent.toFixed(2)}%`
          : 'N/A',
        dolarValue: dolar?.regularMarketPrice?.toFixed(2) || 'N/A',
        dolarVol: dolar?.regularMarketChangePercent
          ? `${dolar.regularMarketChangePercent.toFixed(2)}%`
          : 'N/A',
        bitcoinValue: btc?.regularMarketPrice?.toFixed(0) || 'N/A',
        bitcoinVol: btc?.regularMarketChangePercent
          ? `${btc.regularMarketChangePercent.toFixed(2)}%`
          : 'N/A',
        ifixValue: ifix?.regularMarketPrice?.toFixed(0) || 'N/A',
        ifixVol: ifix?.regularMarketChangePercent
          ? `${ifix.regularMarketChangePercent.toFixed(2)}%`
          : 'N/A'
      };
    } catch (err) {
      console.error('Erro índices globais:', err.message);
      return {
        ibovespaValue: 'N/A',
        ibovespaVol: 'N/A',
        dolarValue: 'N/A',
        dolarVol: 'N/A',
        bitcoinValue: 'N/A',
        bitcoinVol: 'N/A',
        ifixValue: 'N/A',
        ifixVol: 'N/A'
      };
    }
  }
}

module.exports = new YahooFinanceService();

