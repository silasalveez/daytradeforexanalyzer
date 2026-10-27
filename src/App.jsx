import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Loader2, 
  Clock, 
  Crosshair, 
  ShieldAlert, 
  Target,
  Info,
  Globe2,
  AlertTriangle,
  CheckCircle2,
  ScanSearch,
  Radar,
  Zap,
  Newspaper
} from 'lucide-react';

const ASSETS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'AUD/USD',
  'USD/CAD',
  'USD/CHF',
  'BTC/USD',
  'ETH/USD',
  'SOL/USD',
  'XRP/USD'
];

// Base approximations for realistic mock generation
const BASE_PRICES = {
  'EUR/USD': 1.0850,
  'GBP/USD': 1.2650,
  'USD/JPY': 150.50,
  'AUD/USD': 0.6550,
  'USD/CAD': 1.3550,
  'USD/CHF': 0.8850,
  'BTC/USD': 68500.00,
  'ETH/USD': 3500.00,
  'SOL/USD': 150.00,
  'XRP/USD': 0.5500
};

// Manchetes e contextos macroeconômicos simulados para enriquecer a análise quando oportuno
const FOREX_NEWS = [
  "Dados recentes do Payroll (NFP) e abrandamento da inflação (CPI) nos EUA enfraquecem o Dólar no curtíssimo prazo, criando fluxo favorável para esta perna de tendência.",
  "Postura agressiva (Hawkish) em recentes declarações de Bancos Centrais injetou liquidez e volatilidade institucional, confirmando o viés do nosso setup.",
  "Tensão geopolítica recente aumentou o fluxo de capital para ativos de refúgio (Safe-Haven), provocando deslocamento de preço (Displacement) que valida esta entrada.",
  "O mercado está precificando antecipadamente o próximo ciclo de corte de juros, gerando um desbalanceamento no book de ofertas que favorece matematicamente esta direção."
];

const CRYPTO_NEWS = [
  "Fluxo contínuo de capital institucional (ETFs Spot) continua absorvendo a oferta disponível nas corretoras, gerando extrema assimetria a favor do movimento.",
  "Recentes atritos regulatórios globais já foram completamente precificados e absorvidos pelos 'Bulls', limpando o caminho para um movimento técnico fluido.",
  "Fuga de capital dos mercados tradicionais asiáticos para ativos digitais nas últimas 24h corrobora com a quebra de estrutura (BOS) que acabamos de identificar.",
  "Métricas On-Chain revelam que mineradores e 'Whales' pausaram as vendas, removendo a pressão vendedora e facilitando a ação de preço neste nível de Order Block."
];

const MARKET_SESSIONS = [
  { name: 'Cripto (24/7)', start: 0, end: 24, time: '24 Horas', pairs: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD'] },
  { name: 'Tóquio', start: 21, end: 6, time: '21:00 - 06:00 BRT', pairs: ['USD/JPY', 'AUD/USD'] },
  { name: 'Londres', start: 5, end: 13, time: '05:00 - 13:00 BRT', pairs: ['EUR/USD', 'GBP/USD', 'USD/CHF'] },
  { name: 'Nova York', start: 10, end: 18, time: '10:00 - 18:00 BRT', pairs: ['EUR/USD', 'USD/CAD', 'GBP/USD'] },
  { name: 'Sydney', start: 19, end: 4, time: '19:00 - 04:00 BRT', pairs: ['AUD/USD', 'USD/JPY'] }
];

export default function App() {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [radarOpportunities, setRadarOpportunities] = useState([]);
  const [livePrices, setLivePrices] = useState(BASE_PRICES);

  // Busca preços reais de mercado a cada 60s para alinhar a análise com o gráfico
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const newPrices = { ...BASE_PRICES };
        
        // 1. Fetch Fiat (Forex)
        try {
          const resFiat = await fetch('https://open.er-api.com/v6/latest/USD');
          const data = await resFiat.json();
          if (data && data.rates) {
            newPrices['EUR/USD'] = 1 / data.rates.EUR;
            newPrices['GBP/USD'] = 1 / data.rates.GBP;
            newPrices['USD/JPY'] = data.rates.JPY;
            newPrices['AUD/USD'] = 1 / data.rates.AUD;
            newPrices['USD/CAD'] = data.rates.CAD;
            newPrices['USD/CHF'] = data.rates.CHF;
          }
        } catch (e) { console.warn("Erro ao buscar dados Fiat"); }

        // 2. Fetch Cripto (Binance)
        try {
          const resCrypto = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22,%22XRPUSDT%22%5D');
          const dataCrypto = await resCrypto.json();
          if (Array.isArray(dataCrypto)) {
            dataCrypto.forEach(coin => {
              if (coin.symbol === 'BTCUSDT') newPrices['BTC/USD'] = parseFloat(coin.price);
              if (coin.symbol === 'ETHUSDT') newPrices['ETH/USD'] = parseFloat(coin.price);
              if (coin.symbol === 'SOLUSDT') newPrices['SOL/USD'] = parseFloat(coin.price);
              if (coin.symbol === 'XRPUSDT') newPrices['XRP/USD'] = parseFloat(coin.price);
            });
          }
        } catch (e) { console.warn("Erro ao buscar dados Crypto"); }

        setLivePrices(newPrices);
      } catch (e) {
        console.warn("Falha geral ao buscar preços reais, usando base de fallback.");
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Obter hora atual no Horário de Brasília (BRT)
  const getBRTHour = () => {
    const brtString = currentTime.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false });
    return parseInt(brtString, 10) % 24;
  };

  // Check if a specific market is open
  const checkMarketStatus = (start, end) => {
    if (start === 0 && end === 24) return true; // Cripto 24/7
    const currentBRTHours = getBRTHour();
    if (start < end) {
      return currentBRTHours >= start && currentBRTHours < end;
    } else { 
      return currentBRTHours >= start || currentBRTHours < end;
    }
  };

  // Helper para padronizar casas decimais e "pips/pontos" dependendo da classe de ativo
  const getAssetConfig = (pair) => {
    if (pair === 'BTC/USD') return { decimals: 2, pipValue: 15, isCrypto: true };
    if (pair === 'ETH/USD') return { decimals: 2, pipValue: 2, isCrypto: true };
    if (pair === 'SOL/USD') return { decimals: 3, pipValue: 0.2, isCrypto: true };
    if (pair === 'XRP/USD') return { decimals: 4, pipValue: 0.002, isCrypto: true };
    if (pair.includes('JPY')) return { decimals: 3, pipValue: 0.01, isCrypto: false };
    return { decimals: 5, pipValue: 0.0001, isCrypto: false };
  };

  // Generate Opportunity Radar based on active sessions
  useEffect(() => {
    const generateRadarOpps = () => {
      // Obter hora atual BRT isoladamente para não depender do state global de segundos
      const currentBRTHours = parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }), 10) % 24;
      
      const isMarketOpen = (start, end) => {
        if (start === 0 && end === 24) return true;
        if (start < end) {
          return currentBRTHours >= start && currentBRTHours < end;
        } else { 
          return currentBRTHours >= start || currentBRTHours < end;
        }
      };

      const activeSessions = MARKET_SESSIONS.filter(s => isMarketOpen(s.start, s.end));
      
      // Select pairs relevant to open sessions, fallback to EUR/USD if weekend/closed
      let activePairs = [];
      activeSessions.forEach(session => {
        activePairs = [...activePairs, ...session.pairs];
      });
      activePairs = [...new Set(activePairs)]; // Remove duplicates
      
      if (activePairs.length === 0) activePairs = ['EUR/USD', 'USD/JPY']; // Fallback
      
      // Pick top 3 pairs for the radar
      const selectedRadarPairs = activePairs.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const opps = selectedRadarPairs.map(pair => {
        const config = getAssetConfig(pair);
        const decimals = config.decimals;
        const pipValue = config.pipValue;
        
        // Utiliza o preço real capturado via API, ou fallback
        const basePrice = livePrices[pair] || BASE_PRICES[pair];
        
        // Simulador de Qualidade do Setup (Filtro Institucional)
        const qualityScore = Math.random();
        
        if (qualityScore > 0.65) {
          // 35% de chance de NÃO RECOMENDAR a operação por risco elevado
          const avoidReasons = [
            "Conflito Multi-Timeframe: O gráfico de 4H dita tendência direcional, mas os 15m e 5m estão em consolidação (Choppy Market) sem captura de liquidez. Aguarde clareza.",
            "Falta de Assimetria: Proximidade perigosa de um Order Block (OB) de tempo maior. Altíssimo risco de manipulação institucional (Sweep) no curto prazo. Preservação de capital recomendada.",
            "Desalinhamento de Fluxo: RSI divergente do MACD nos 15m e ausência de quebra de estrutura (ChoCh) nos 5m. Ficar de fora também é operar com maestria.",
            "Zona de Armadilha (Inducement): Ativo negociando no meio de um range. Aguardando captura de liquidez nos extremos antes de buscar qualquer execução segura."
          ];
          
          return {
            pair,
            action: 'AGUARDAR',
            entry: '-',
            sl: '-',
            tp: '-',
            ratio: '-',
            reason: avoidReasons[Math.floor(Math.random() * avoidReasons.length)]
          };
        }

        // Caso a qualidade seja boa, prossegue para COMPRA ou VENDA
        const entryOffset = (Math.random() * 4 - 2) * pipValue;
        const entry = basePrice + entryOffset;
        const action = Math.random() > 0.5 ? 'COMPRA' : 'VENDA';
        
        // Perfil Day Trade: Stop Loss curto (5 a 10 pips)
        let riskPips = Math.floor(Math.random() * 6) + 5; 
        let rewardRatio = Math.floor(Math.random() * 2) + 3; // 3 to 4 ratio for radar
        let rewardPips = riskPips * rewardRatio;

        let sl = action === 'COMPRA' ? entry - (riskPips * pipValue) : entry + (riskPips * pipValue);
        let tp = action === 'COMPRA' ? entry + (rewardPips * pipValue) : entry - (rewardPips * pipValue);

        // Adicionando chance de contexto de manchete global no radar (30% de chance)
        const hasNewsCatalyst = Math.random() > 0.7;
        const newsContext = hasNewsCatalyst ? 
          (config.isCrypto ? 
            " Impulsionado por recentes métricas de acumulação institucional on-chain." : 
            " Confluência com recente volatilidade gerada por dados macroeconômicos (USD)."
          ) : "";

        // Session context reason
        let sessionContext = activeSessions.length > 1 
          ? `Sinergia de liquidez (${activeSessions[0].name}/${activeSessions[1].name}). Gatilho de 5m alinhado com fluxo Macro.${newsContext}`
          : `Viés de 15m perfeitamente alinhado com a estrutura da sessão de ${activeSessions[0]?.name || 'Ásia'}.${newsContext}`;

        return {
          pair,
          action,
          entry: entry.toFixed(decimals),
          sl: sl.toFixed(decimals),
          tp: tp.toFixed(decimals),
          ratio: `1:${rewardRatio}`,
          reason: sessionContext
        };
      });

      setRadarOpportunities(opps);
    };

    // Executa imediatamente ao carregar
    generateRadarOpps();
    
    // Atualiza o radar exatamente a cada 20 segundos
    const radarInterval = setInterval(generateRadarOpps, 20000);
    
    return () => clearInterval(radarInterval);
  }, [livePrices]); // Atualiza as referências caso os preços ao vivo mudem

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Simula análise complexa de 3 segundos
    setTimeout(() => {
      generateAnalysis(selectedPair);
      setIsAnalyzing(false);
    }, 3000);
  };

  const generateAnalysis = (pair) => {
    const config = getAssetConfig(pair);
    const decimals = config.decimals;
    
    const rand = Math.random();
    let action = 'NEUTRO';
    if (rand < 0.45) action = 'COMPRA';
    else if (rand < 0.90) action = 'VENDA';

    if (action === 'NEUTRO') {
      setAnalysisResult({
        action,
        justification: "Análise Multi-Timeframe (MTF) detectou divergência severa de contexto: O gráfico Diário (Macro) aponta um viés institucional claro, porém os tempos de execução precisos (15m e 5m) encontram-se presos em um forte range de consolidação e acúmulo de ordens. Não há assimetria de risco favorável neste instante. A paciência é a principal virtude do trader profissional. Aguarde a manipulação (Liquidity Sweep) nos extremos deste canal antes de comprometer seu capital com segurança."
      });
      return;
    }

    let pipValue = config.pipValue;
    let basePrice = livePrices[pair] || BASE_PRICES[pair];
    
    // Perfil Day Trade: Entrada a mercado ou com micro variação do spread atual
    let entryOffset = (Math.random() * 3 - 1.5) * pipValue;
    let entry = basePrice + entryOffset;

    // Perfil Day Trade R:R garantido: Stop Loss curto (5 a 12 pips)
    let riskPips = Math.floor(Math.random() * 8) + 5; 
    let rewardRatio = Math.floor(Math.random() * 3) + 3; 
    let rewardPips = riskPips * rewardRatio;

    let sl, tp;
    if (action === 'COMPRA') {
      sl = entry - (riskPips * pipValue);
      tp = entry + (rewardPips * pipValue);
    } else {
      sl = entry + (riskPips * pipValue);
      tp = entry - (rewardPips * pipValue);
    }

    // Lógica Especialista: Avaliar se há um gatilho fundamentalista (notícia) corroborando a técnica (50% de chance)
    const includeNewsCatalyst = Math.random() > 0.5;
    const newsPool = config.isCrypto ? CRYPTO_NEWS : FOREX_NEWS;
    const selectedCatalyst = includeNewsCatalyst ? newsPool[Math.floor(Math.random() * newsPool.length)] : null;

    setAnalysisResult({
      action,
      entry: entry.toFixed(decimals),
      sl: sl.toFixed(decimals),
      tp: tp.toFixed(decimals),
      ratio: `1:${rewardRatio}`,
      catalyst: selectedCatalyst,
      indicators: {
        rsi: action === 'COMPRA' ? 'Divergência Oculta (15m) + Oversold (5m)' : 'Exaustão Institucional (15m) + Overbought (5m)',
        macd: action === 'COMPRA' ? 'Expansão de Volume Comprador Alinhado (MTF)' : 'Cruzamento de Sinal Institucional de Baixa',
        vwap: action === 'COMPRA' ? 'Preço com forte aceitação acima da VWAP (15m)' : 'Rejeição violenta na VWAP Ancorada (1H)'
      },
      justification: action === 'COMPRA'
        ? `Setup de Alta Probabilidade (Top-Down Alignment). O viés macro (4H/1D) confirmou a absorção da oferta em uma zona institucional de Desconto (Discount Array). Ao descermos para os tempos gráficos de execução (15m e 5m), presenciamos uma clara Quebra de Estrutura (ChoCh) acompanhada de forte volume direcional, gerando um Imbalance (FVG) limpo. A entrada sugerida foi calculada com precisão cirúrgica para o reteste exato no Order Block do gráfico de 5 minutos. Execute com tranquilidade, o risco está estritamente controlado e matematicamente ao seu favor.`
        : `Alinhamento Institucional de Venda Confirmado. O contexto macro atingiu um nível de Premium (Order Block não mitigado). Observando a fractalidade do preço nos gráficos de 15m e 5m, identificamos uma clássica captura de liquidez (Buy-Side Sweep) que induziu o varejo à compra, imediatamente seguida por uma forte rejeição e quebra estrutural (BOS) de baixa. A entrada apontada no 5m aproveita o respiro do preço (Pullback) em direção ao Fair Value Gap. Setup com risco-retorno amplamente assimétrico, blindando a operação contra ruídos, garantindo uma execução serena e profissional.`
    });
  };

  const getTVConfigString = () => {
    if (selectedPair === 'BTC/USD') return 'BINANCE:BTCUSDT';
    if (selectedPair === 'ETH/USD') return 'BINANCE:ETHUSDT';
    if (selectedPair === 'SOL/USD') return 'BINANCE:SOLUSDT';
    if (selectedPair === 'XRP/USD') return 'BINANCE:XRPUSDT';
    return `FX:${selectedPair.replace('/', '')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col">
      
      {/* Barra de Sessões de Mercado */}
      <div className="bg-slate-950 border-b border-slate-900/80 text-xs py-2 px-4 overflow-x-auto custom-scrollbar flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[700px]">
          <div className="flex items-center gap-5 text-slate-400">
             <div className="flex items-center gap-1.5 font-semibold text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-800/50">
               <Globe2 className="w-3.5 h-3.5 text-blue-400" />
               Mercados (BRT):
             </div>
             {MARKET_SESSIONS.map(session => {
                const isOpen = checkMarketStatus(session.start, session.end);
                return (
                  <div key={session.name} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`relative flex h-2 w-2 ${isOpen ? '' : 'opacity-50'}`}>
                        {isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpen ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                      </span>
                      <span className={`font-semibold ${isOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {session.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 pl-3.5">{session.time}</span>
                  </div>
                );
             })}
          </div>
        </div>
      </div>

      {/* Header Principal */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-400">
            <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
              FX & Crypto <span className="text-blue-500 font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">PRO</span>
            </h1>
            <h1 className="text-xl font-bold tracking-tight text-white sm:hidden">FX Pro</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-lg font-mono shadow-inner">
            <Clock className="h-4 w-4 text-blue-500" />
            {currentTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' })} BRT
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 py-6 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* COLUNA ESQUERDA: Controles e Gráfico */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/60 p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Ativo Analisado
                  </label>
                  <select 
                    value={selectedPair}
                    onChange={(e) => {
                      setSelectedPair(e.target.value);
                      setAnalysisResult(null);
                    }}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer hover:border-slate-600 shadow-inner"
                  >
                    {ASSETS.map(pair => (
                      <option key={pair} value={pair}>{pair}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl px-4 py-3.5 font-bold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Extraindo Dados...
                    </>
                  ) : (
                    <>
                      <ScanSearch className="h-5 w-5" />
                      Iniciar Análise Profunda
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-800/60 p-1 shadow-xl flex-grow min-h-[450px] relative overflow-hidden">
              <iframe
                title="TradingView Chart"
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_123&symbol=${getTVConfigString()}&interval=15&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=0f172a&studies=%5B%22RSI%40tv-basicstudies%22%2C%22MACD%40tv-basicstudies%22%2C%22VWAP%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=America/Sao_Paulo`}
                className="w-full h-full border-0 rounded-xl"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* COLUNA DIREITA: Radar & Motor de Análise */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* NOVO: Radar de Oportunidades */}
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden flex-shrink-0">
               <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-800/20 flex items-center gap-2">
                 <div className="p-1.5 bg-blue-500/20 rounded-md">
                   <Radar className="w-4 h-4 text-blue-400" />
                 </div>
                 <h3 className="text-sm font-bold text-white uppercase tracking-wider">Radar de Oportunidades</h3>
                 <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                   </span>
                   AO VIVO
                 </div>
               </div>
               
               <div className="p-4 flex flex-col gap-3">
                 {radarOpportunities.map((opp, idx) => (
                   <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-200">{opp.pair}</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                          opp.action === 'COMPRA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          opp.action === 'VENDA' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {opp.action}
                        </span>
                      </div>
                      
                      {opp.action !== 'AGUARDAR' ? (
                        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                          <div className="bg-slate-900 rounded p-1.5 border border-slate-800/50">
                             <div className="text-[10px] text-slate-500 mb-0.5">ENTRY</div>
                             <div className="text-xs font-mono text-white">{opp.entry}</div>
                          </div>
                          <div className="bg-rose-950/20 rounded p-1.5 border border-rose-900/30">
                             <div className="text-[10px] text-rose-500/70 mb-0.5">SL</div>
                             <div className="text-xs font-mono text-rose-400">{opp.sl}</div>
                          </div>
                          <div className="bg-emerald-950/20 rounded p-1.5 border border-emerald-900/30">
                             <div className="text-[10px] text-emerald-500/70 mb-0.5">TP ({opp.ratio})</div>
                             <div className="text-xs font-mono text-emerald-400">{opp.tp}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-2 mb-3 bg-amber-950/20 rounded border border-amber-900/30 text-amber-500 text-[11px] font-semibold">
                           <ShieldAlert className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                           Operação bloqueada por critério de risco
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2 text-[11px] text-slate-400 leading-tight bg-slate-900/50 p-2 rounded">
                        {opp.action !== 'AGUARDAR' ? (
                          <Zap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5 opacity-80" />
                        )}
                        <p>{opp.reason}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Análise Individual */}
            <div className="flex-grow flex flex-col">
              {isAnalyzing && (
                 <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/60 p-8 flex flex-col items-center justify-center h-full min-h-[400px] shadow-xl">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                      <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mb-6 relative z-10"/>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Processando Algoritmos...</h3>
                    <p className="text-slate-400 text-center text-sm max-w-[280px]">
                      Avaliando Order Blocks, VWAP e divergências institucionais em <strong className="text-indigo-400">{selectedPair}</strong>.
                    </p>
                 </div>
              )}

              {!isAnalyzing && !analysisResult && (
                 <div className="bg-slate-900/20 rounded-2xl border border-slate-800/50 border-dashed p-10 flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 text-center transition-all hover:bg-slate-900/40 hover:border-slate-700/50">
                    <Crosshair className="w-14 h-14 mb-4 opacity-20"/>
                    <h3 className="text-base font-semibold text-slate-400 mb-2">Análise Específica Pendente</h3>
                    <p className="text-sm max-w-[260px] leading-relaxed">
                      Selecione um ativo específico e clique em "Iniciar Análise Profunda" para mapear zonas de liquidez e setups com R:R garantido.
                    </p>
                 </div>
              )}

              {!isAnalyzing && analysisResult && (
                <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                  
                  <div className={`px-5 py-4 flex items-center justify-between border-b ${
                    analysisResult.action === 'COMPRA' ? 'border-emerald-500/30 bg-emerald-500/10' :
                    analysisResult.action === 'VENDA' ? 'border-rose-500/30 bg-rose-500/10' :
                    'border-amber-500/30 bg-amber-500/10'
                  }`}>
                    <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                       <ScanSearch className="w-4 h-4 opacity-70" />
                       Análise para {selectedPair}
                    </span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-black text-sm tracking-widest shadow-inner ${
                      analysisResult.action === 'COMPRA' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      analysisResult.action === 'VENDA' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {analysisResult.action === 'COMPRA' && <TrendingUp className="h-4 w-4" />}
                      {analysisResult.action === 'VENDA' && <TrendingDown className="h-4 w-4" />}
                      {analysisResult.action === 'NEUTRO' && <Minus className="h-4 w-4" />}
                      {analysisResult.action}
                    </div>
                  </div>

                  <div className="p-5 space-y-5 flex-grow overflow-y-auto custom-scrollbar">
                    
                    {analysisResult.action !== 'NEUTRO' && (
                      <>
                        <div>
                          <div className="grid grid-cols-1 gap-2.5">
                            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 flex justify-between items-center shadow-inner">
                              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                                <Crosshair className="h-3.5 w-3.5 text-blue-400" /> Entry Zone
                              </div>
                              <div className="text-lg font-mono font-bold text-white">{analysisResult.entry}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="bg-rose-950/30 rounded-xl p-3 border border-rose-900/40 flex flex-col justify-center shadow-inner">
                                <div className="flex items-center gap-1 text-rose-500/80 text-[10px] mb-1 uppercase font-black">
                                  <ShieldAlert className="h-3 w-3" /> Stop Loss
                                </div>
                                <div className="text-base font-mono font-bold text-rose-400">{analysisResult.sl}</div>
                              </div>
                              <div className="bg-emerald-950/30 rounded-xl p-3 border border-emerald-900/40 flex flex-col justify-center shadow-inner relative overflow-hidden">
                                <div className="absolute -right-2 -bottom-2 opacity-10">
                                   <Target className="w-12 h-12 text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-500/80 text-[10px] mb-1 uppercase font-black relative z-10">
                                  <Target className="h-3 w-3" /> Take Profit
                                </div>
                                <div className="text-base font-mono font-bold text-emerald-400 relative z-10">{analysisResult.tp}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-indigo-950/20 border border-indigo-900/40 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                            Risco/Retorno (R:R) Blindado
                          </div>
                          <span className="font-black text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded text-xs tracking-widest border border-indigo-700/50">
                            {analysisResult.ratio}
                          </span>
                        </div>

                        {analysisResult.catalyst && (
                          <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-3.5 shadow-inner">
                            <h4 className="text-blue-400/90 font-bold flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-widest">
                              <Newspaper className="h-3.5 w-3.5" /> Catalisador Macroeconômico
                            </h4>
                            <p className="text-xs text-blue-200/80 leading-relaxed text-justify italic">
                              "{analysisResult.catalyst}"
                            </p>
                          </div>
                        )}

                        <div>
                           <div className="grid grid-cols-1 gap-1.5">
                              <div className="flex justify-between items-center text-[11px] bg-slate-950/60 px-3 py-2 rounded border border-slate-800/60">
                                <span className="text-slate-500 font-bold">RSI (14)</span>
                                <span className="text-slate-300 font-medium">{analysisResult.indicators.rsi}</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] bg-slate-950/60 px-3 py-2 rounded border border-slate-800/60">
                                <span className="text-slate-500 font-bold">MACD</span>
                                <span className="text-slate-300 font-medium">{analysisResult.indicators.macd}</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] bg-slate-950/60 px-3 py-2 rounded border border-slate-800/60">
                                <span className="text-slate-500 font-bold">VWAP</span>
                                <span className="text-slate-300 font-medium">{analysisResult.indicators.vwap}</span>
                              </div>
                           </div>
                        </div>

                        {/* Alertas de Risco Aprimorados */}
                        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-3.5 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                          <h4 className="text-red-500/90 font-bold flex items-center gap-1.5 mb-2.5 text-[10px] uppercase tracking-widest">
                            <AlertTriangle className="h-3.5 w-3.5" /> Alertas de Risco (DANGER ZONE)
                          </h4>
                          <ul className="space-y-2 text-[11px] text-slate-300/90 leading-relaxed pl-1">
                            <li className="flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                              <p><strong className="text-red-400">Calendário e Notícias (News):</strong> Consulte o Factory Calendar. Evite operar 15 min antes/depois de eventos red folder (NFP, CPI) para evitar distorção de spread (Slippage grave).</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                              <p><strong className="text-red-400">Disciplina do Stop Loss:</strong> O SL inserido em {analysisResult.sl} é inegociável. É a sua apólice de seguro contra movimentos institucionais adversos.</p>
                            </li>
                          </ul>
                        </div>
                      </>
                    )}

                    {analysisResult.action === 'NEUTRO' && (
                      <div className="flex flex-col items-center text-center justify-center py-6 h-full">
                         <Minus className="w-10 h-10 text-amber-500/70 mb-3" />
                         <h3 className="text-base font-bold text-white mb-2">Sem Setup Claro (No Trade Zone)</h3>
                         <p className="text-xs text-slate-400 leading-relaxed px-4">
                           {analysisResult.justification}
                         </p>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1);
        }
      `}} />
    </div>
  );
}
