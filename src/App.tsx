import { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Download, 
  Clipboard, 
  Check, 
  RefreshCw, 
  Radio, 
  Clock, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Search, 
  FilePlus, 
  BookOpen, 
  Sliders, 
  Layers,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { playClick, playSuccess, playRadioChirp, playStatic, setSoundEnabled } from './utils/audio';

interface SavedReport {
  id: string;
  matricula: string;
  cc: string;
  motivo: string;
  dataApreensao: string;
  dataLevantamento: string;
  horaLevantamento: string;
  texto: string;
  nomeFicheiro: string;
  agenteInfo?: string;
  valorMulta?: string;
  localidade?: string;
  competencia?: string;
}

export default function App() {
  // Config: Toggle between DPSA (San Andreas), DPLS (Los Santos), or DBC (Departamento Blaine County)
  const [department, setDepartment] = useState<'DPSA' | 'DPLS' | 'DBC'>('DPSA');
  const [soundOn, setSoundOn] = useState(true);
  
  // Advanced Logging Toggle
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Form Inputs
  const [matriculaInput, setMatriculaInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [opcaoMotivo, setOpcaoMotivo] = useState('1');
  const [customMotive, setCustomMotive] = useState('');
  
  // Advanced Fields
  const [agenteInfo, setAgenteInfo] = useState('');
  const [valorMulta, setValorMulta] = useState('45000');
  const [localidade, setLocalidade] = useState('');
  const [tempoApreensaoHoras, setTempoApreensaoHoras] = useState('24'); // default 24h (1 dia)

  // Outputs & History
  const [generatedReportText, setGeneratedReportText] = useState('');
  const [generatedFileName, setGeneratedFileName] = useState('');
  const [copied, setCopied] = useState(false);
  const [reportsHistory, setReportsHistory] = useState<SavedReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Time & Date
  const [systemTime, setSystemTime] = useState(new Date());

  // Set initial sound state
  useEffect(() => {
    setSoundEnabled(soundOn);
  }, [soundOn]);

  // System clock interval
  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Play boot dispatch sounds
  useEffect(() => {
    const timer1 = setTimeout(() => {
      playRadioChirp();
      const timer2 = setTimeout(() => playStatic(), 150);
      return () => clearTimeout(timer2);
    }, 500);
    return () => clearTimeout(timer1);
  }, []);

  // Load history from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('offset_rp_reports_history');
    if (saved) {
      try {
        setReportsHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar histórico do localStorage", e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: SavedReport[]) => {
    setReportsHistory(newHistory);
    localStorage.setItem('offset_rp_reports_history', JSON.stringify(newHistory));
  };

  // Penal Code Options conforming exactly to the user's specification
  const penalCode = [
    { op: "1", competencia: "Competência DPSA", motivo: "Veículo apreendido num assalto", custos: "0", coima: "45000" },
    { op: "2", competencia: "Competência DPSA", motivo: "Veículo apreendido no decorrer de tentativa de fuga às autoridades", custos: "0", coima: "25000" },
    { op: "3", competencia: "Competência DPSA", motivo: "Veículo apreendido por falta de carta de condução", custos: "0", coima: "15000" },
    { op: "4", competencia: "Competência DPSA", motivo: "Veículo apreendido no decorrer de uma investigação", custos: "0", coima: "0" },
    { op: "5", competencia: "Competência DPSA", motivo: "Veículo apreendido por utilização da viatura para causar danos ou desacatos de forma premeditada", custos: "0", coima: "10000" },
  ];

  const obterMotivo = (opcao: string) => {
    const found = penalCode.find(p => p.op === opcao);
    if (found) return found.motivo;
    if (opcao === "custom") return customMotive.trim() || "Motivo personalizado não especificado";
    return "";
  };

  const obterCompetencia = (opcao: string) => {
    const found = penalCode.find(p => p.op === opcao);
    return found ? found.competencia : "Competência Geral";
  };

  const obterCoimaPadrao = (opcao: string) => {
    const found = penalCode.find(p => p.op === opcao);
    return found ? found.coima : "0";
  };

  // Auto update standard fine when motive changes
  useEffect(() => {
    const coima = obterCoimaPadrao(opcaoMotivo);
    setValorMulta(coima);
  }, [opcaoMotivo]);

  // Unique filename generator with plate checks
  const obterNomeFicheiro = (matricula: string, history: SavedReport[]) => {
    const nomeBase = `Relatorio_${matricula}`;
    
    // Check how many times this plate exists in our session history
    const matches = history.filter(r => r.matricula === matricula);
    if (matches.length === 0) {
      return `${nomeBase}.txt`;
    } else {
      let contador = 1;
      let nome = `${nomeBase}_${contador}.txt`;
      while (history.some(r => r.nomeFicheiro === nome)) {
        contador++;
        nome = `${nomeBase}_${contador}.txt`;
      }
      return nome;
    }
  };

  const handleGerarRelatorio = (e: React.FormEvent) => {
    e.preventDefault();

    if (!matriculaInput.trim()) {
      alert('Matrícula inválida. Operação cancelada.');
      return;
    }

    // Clean matricula to avoid "VA-VA-12-AB" double-prefix
    let cleanPlate = matriculaInput.toUpperCase().trim();
    if (cleanPlate.startsWith("VA-")) {
      cleanPlate = cleanPlate.substring(3);
    }
    
    const matricula = `VA-${cleanPlate}`;
    const numero_cc = ccInput.trim() || "Desconhecido";
    const motivo = obterMotivo(opcaoMotivo);
    const competencia = obterCompetencia(opcaoMotivo);

    // Dynamic release date logic based on customizable hours
    const agora = new Date();
    const dataApreensao = agora.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const amanha = new Date();
    const horasParaAdicionar = parseInt(tempoApreensaoHoras) || 24;
    amanha.setHours(agora.getHours() + horasParaAdicionar);

    const dataLevantamento = amanha.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaLevantamento = amanha.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Exact Portuguese report string formatting compatible with Discord logs/Python output
    let relatorio = "";
    
    if (isAdvancedMode) {
      // Advanced Immersive Judicial Format
      relatorio = (
        `==================================================\n` +
        `       RELATÓRIO DE APREENSÃO DE VIATURA           \n` +
        `       SISTEMA TERMINAL POLICIAL - ${department}       \n` +
        `==================================================\n\n` +
        `MATRÍCULA DA VIATURA: ${matricula}\n` +
        `ESTADO: Viatura Apreendida\n` +
        `COMPETÊNCIA JURÍDICA: ${competencia}\n\n` +
        `DOCUMENTO DO CONDUTOR (CC): ${numero_cc}\n` +
        `MOTIVO DA APREENSÃO: ${motivo}\n` +
        (agenteInfo ? `REGISTADO POR: ${agenteInfo}\n` : '') +
        (valorMulta ? `VALOR DA COIMA COBRADA: ${parseFloat(valorMulta).toLocaleString('pt-PT')}€\n` : '') +
        (localidade ? `LOCAL DA OCORRÊNCIA: ${localidade}\n` : '') +
        `DATA DE APREENSÃO: ${dataApreensao}\n\n` +
        `NOTA: O proprietário poderá levantar a viatura a partir de:\n` +
        `>>>> ${dataLevantamento} às ${horaLevantamento} <<<<\n\n` +
        `--------------------------------------------------\n` +
        `Ficheiro auto-gerado com sucesso para fins judiciais.\n` +
        `OFFSET PORTUGAL ROLEPLAY - Todos os direitos reservados.\n` +
        `==================================================\n`
      );
    } else {
      // Standard exact Python script formatting requested (with selected motive details)
      relatorio = (
        `\n${matricula}\n` +
        `Viatura Apreendida\n\n` +
        `Número de CC: ${numero_cc}\n` +
        `Motivo da Apreensão: ${motivo}\n\n` +
        `Nota: Levantar dia ${dataLevantamento} às ${horaLevantamento}\n`
      );
    }

    const nomeFicheiro = obterNomeFicheiro(matricula, reportsHistory);

    setGeneratedReportText(relatorio);
    setGeneratedFileName(nomeFicheiro);
    playRadioChirp();

    // Save to local history
    const newReport: SavedReport = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      matricula,
      cc: numero_cc,
      motivo,
      dataApreensao: agora.toLocaleString('pt-PT'),
      dataLevantamento,
      horaLevantamento,
      texto: relatorio,
      nomeFicheiro,
      agenteInfo: agenteInfo || undefined,
      valorMulta: valorMulta || undefined,
      localidade: localidade || undefined,
      competencia
    };

    const updatedHistory = [newReport, ...reportsHistory].slice(0, 30);
    saveHistory(updatedHistory);
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(generatedReportText);
    playSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDescarregar = () => {
    playSuccess();
    const element = document.createElement("a");
    const file = new Blob([generatedReportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = generatedFileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleLimpar = () => {
    playClick();
    setMatriculaInput('');
    setCcInput('');
    setOpcaoMotivo('1');
    setCustomMotive('');
    setAgenteInfo('');
    setValorMulta('45000');
    setLocalidade('');
    setTempoApreensaoHoras('24');
    setGeneratedReportText('');
    setGeneratedFileName('');
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    if (confirm("Tem a certeza que deseja eliminar este relatório do histórico local?")) {
      const updated = reportsHistory.filter(r => r.id !== id);
      saveHistory(updated);
    }
  };

  const handleClearAllHistory = () => {
    playClick();
    if (confirm("ATENÇÃO: Deseja apagar permanentemente todo o histórico de relatórios desta sessão?")) {
      saveHistory([]);
      playStatic();
    }
  };

  const handleExportarTodos = () => {
    playSuccess();
    let text = `==================================================\n`;
    text += `   COMPILAÇÃO DE APREENSÕES - SESSÃO REGISTADA\n`;
    text += `   DATA DE EXPORTAÇÃO: ${systemTime.toLocaleString('pt-PT')}\n`;
    text += `   DEPARTAMENTO COORDENADOR: ${department}\n`;
    text += `==================================================\n\n`;

    reportsHistory.forEach((rep, index) => {
      text += `--- APREENSÃO #${index + 1} (${rep.id}) ---\n`;
      text += rep.texto;
      text += `\n\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Sessao_Completa_${department}_${systemTime.toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Styling based on department
  const accentColor = department === 'DPSA' ? 'text-amber-400' : department === 'DPLS' ? 'text-blue-400' : 'text-white';
  const borderHighlight = department === 'DPSA' ? 'border-amber-500/35' : department === 'DPLS' ? 'border-blue-500/35' : 'border-white/40';
  const bgGradient = department === 'DPSA'
    ? 'from-amber-950/95 via-slate-900/98 to-neutral-950/100'
    : department === 'DPLS' 
      ? 'from-blue-950/95 via-slate-900/98 to-neutral-950/100' 
      : 'from-neutral-900/95 via-slate-950/98 to-neutral-950/100';
  
  const neonShadow = department === 'DPSA'
    ? 'shadow-[0_0_15px_rgba(245,158,11,0.2)]'
    : department === 'DPLS' 
      ? 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
      : 'shadow-[0_0_15px_rgba(255,255,255,0.15)]';

  const fillBtnTheme = department === 'DPSA'
    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
    : department === 'DPLS'
      ? 'bg-blue-500 hover:bg-blue-400 text-slate-950'
      : 'bg-white hover:bg-neutral-200 text-slate-950';

  const activeHeaderTab = (tab: typeof department) => {
    if (department === tab) {
      if (tab === 'DPSA') return 'bg-amber-600 text-white shadow-md';
      if (tab === 'DPLS') return 'bg-blue-600 text-white shadow-md';
      return 'bg-white text-slate-950 shadow-md font-extrabold';
    }
    return 'text-gray-400 hover:text-white';
  };

  // Filter history based on search bar query
  const filteredHistory = reportsHistory.filter(rep => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return rep.matricula.toLowerCase().includes(q) || 
           rep.cc.toLowerCase().includes(q) || 
           rep.id.toLowerCase().includes(q) ||
           rep.motivo.toLowerCase().includes(q);
  });

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} text-white font-sans flex flex-col justify-between relative selection:bg-white/20 overflow-x-hidden`}>
      
      {/* Top flashing light bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex z-50">
        <div className={`flex-1 transition-all duration-1000 ${department === 'DPSA' ? 'bg-amber-600 animate-pulse' : department === 'DPLS' ? 'bg-blue-600 animate-pulse' : 'bg-white/80 animate-pulse'}`} />
        <div className="w-12 bg-white/20 animate-ping absolute left-1/2 transform -translate-x-1/2 h-1.5" />
        <div className={`flex-1 transition-all duration-1000 ${department === 'DPSA' ? 'bg-yellow-600 animate-pulse delay-500' : department === 'DPLS' ? 'bg-red-600 animate-pulse delay-500' : 'bg-neutral-400 animate-pulse delay-500'}`} />
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-neutral-900 border ${
            department === 'DPSA' ? 'border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]' :
            department === 'DPLS' ? 'border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]' : 
            'border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
          }`}>
            <Shield className={`w-8 h-8 ${accentColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-widest font-mono uppercase">
                {department === 'DPSA' ? 'DPSA - DEPARTAMENTO DE POLÍCIA DE SAN ANDREAS' : department === 'DPLS' ? 'DPLS - DEPARTAMENTO DE POLÍCIA DE LOS SANTOS' : 'DBC - DEPARTAMENTO BLAINE COUNTY'}
              </h1>
              <span className="animate-ping w-2 h-2 rounded-full bg-red-500" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 font-mono flex items-center gap-1.5">
              <span>SISTEMA DE FISCALIZAÇÃO & REGISTO DE APREENSÕES</span>
              <span className="text-gray-600">&bull;</span>
              <span className="text-amber-400/90 font-bold">OFFSET PORTUGAL RP</span>
            </p>
          </div>
        </div>

        {/* Toggles & Interactive Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Audio Switcher */}
          <button 
            onClick={() => { setSoundOn(!soundOn); playClick(); }}
            className={`p-2 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              soundOn 
                ? 'bg-neutral-900/90 border-emerald-500/30 text-emerald-400' 
                : 'bg-neutral-900/90 border-white/10 text-gray-500'
            }`}
            title={soundOn ? "Mutar Sons do Terminal" : "Ativar Sons do Terminal"}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundOn ? "AUDIO: ON" : "AUDIO: OFF"}</span>
          </button>

          {/* Department Selection Toggle (DPSA / DPLS / DBC) */}
          <div className="flex bg-neutral-900/95 border border-white/10 rounded-lg p-0.5 text-xs">
            <button 
              onClick={() => { playClick(); setDepartment('DPSA'); }}
              className={`px-3.5 py-1.5 rounded-md font-bold uppercase transition-all duration-200 cursor-pointer ${activeHeaderTab('DPSA')}`}
            >
              DPSA
            </button>
            <button 
              onClick={() => { playClick(); setDepartment('DPLS'); }}
              className={`px-3.5 py-1.5 rounded-md font-bold uppercase transition-all duration-200 cursor-pointer ${activeHeaderTab('DPLS')}`}
            >
              DPLS
            </button>
            <button 
              onClick={() => { playClick(); setDepartment('DBC'); }}
              className={`px-3.5 py-1.5 rounded-md font-bold uppercase transition-all duration-200 cursor-pointer ${activeHeaderTab('DBC')}`}
            >
              DBC
            </button>
          </div>

          {/* Digital Clock */}
          <div className="hidden lg:flex items-center gap-2 bg-neutral-900/95 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider text-gray-300">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{systemTime.toLocaleTimeString('pt-PT')}</span>
          </div>
        </div>
      </header>

      {/* Main Terminal Grid Hub */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full z-10 relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: INPUT FORM & VEHICLE VISUAL PREVIEW */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Real-time License Plate Simulator Preview */}
          <div className={`bg-neutral-950/90 rounded-xl p-4 border border-white/10 ${neonShadow} flex flex-col items-center justify-center space-y-3 relative overflow-hidden`}>
            <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[10px] font-mono font-bold text-gray-400">
              <span className={`inline-block w-2 h-2 rounded-full ${department === 'DPSA' ? 'bg-amber-500' : department === 'DPLS' ? 'bg-blue-500' : 'bg-white'}`} />
              SIMULADOR DE MATRÍCULA EM TEMPO REAL
            </div>
            
            <div className="h-4" /> {/* Spacer */}

            {/* Realistic Portuguese/EU License Plate Styling */}
            <div className="w-full max-w-[340px] h-[76px] bg-white rounded-md border-3 border-gray-900 flex items-center justify-between shadow-2xl relative select-none font-mono">
              {/* EU Blue band on the left */}
              <div className="w-9 h-full bg-blue-700 rounded-l-sm flex flex-col items-center justify-between py-1.5 text-white">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[9px] leading-none text-yellow-300 animate-pulse">★</span>
                  <span className="text-[7px] leading-none text-yellow-300 -mt-0.5">★ ★</span>
                </div>
                <span className="text-xs font-extrabold tracking-tighter">P</span>
              </div>

              {/* Plate Text Area */}
              <div className="flex-1 flex items-center justify-center px-2 text-gray-950 text-2xl font-black tracking-widest text-center select-all">
                VA-{(() => {
                  let plate = matriculaInput.toUpperCase().trim() || "00-XX-00";
                  if (plate.startsWith("VA-")) {
                    plate = plate.substring(3);
                  }
                  return plate || "00-XX-00";
                })()}
              </div>

              {/* Real Portuguese Yellow Date Stripe on the right */}
              <div className="w-8 h-full bg-yellow-400 rounded-r-sm border-l border-gray-400 flex flex-col items-center justify-center text-[10px] text-gray-800 font-bold leading-none py-1">
                <span>{systemTime.getFullYear().toString().substring(2)}</span>
                <span className="border-t border-gray-800/30 w-4 my-1" />
                <span>{(systemTime.getMonth() + 1).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 text-center font-mono italic">
              A sigla <strong className="text-white">VA-</strong> é obrigatória e adicionada automaticamente pelo sistema oficial.
            </p>
          </div>

          {/* Core Input Form Block */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-5 border border-white/5 flex flex-col justify-between space-y-4">
            <form onSubmit={handleGerarRelatorio} className="space-y-4">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-gray-300 flex items-center gap-1.5 font-mono">
                  <Radio className={`w-4 h-4 ${accentColor} animate-pulse`} />
                  Formulário de Registo
                </span>
                
                <button
                  type="button"
                  onClick={handleLimpar}
                  className="text-[10px] text-gray-400 hover:text-red-400 transition-colors uppercase font-mono flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer"
                  title="Limpar todos os campos"
                >
                  <RefreshCw className="w-3 h-3" /> Limpar
                </button>
              </div>

              {/* License Plate Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-gray-300 uppercase font-mono">
                    Matrícula da Viatura <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[9px] text-gray-400 italic">Sem "VA-" prefixo</span>
                </div>
                <div className="relative flex rounded-lg overflow-hidden border border-white/10 focus-within:border-white/30 transition-all">
                  <span className="bg-neutral-800 text-neutral-400 px-3 py-2 text-xs font-bold font-mono border-r border-white/10 flex items-center select-none">
                    VA-
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: 88-FF-99 ou 12-AB"
                    value={matriculaInput}
                    onChange={(e) => {
                      playClick();
                      let val = e.target.value.toUpperCase();
                      if (val.startsWith("VA-")) {
                        val = val.substring(3);
                      }
                      setMatriculaInput(val);
                    }}
                    className="w-full bg-black/40 px-3 py-2 text-sm text-white focus:outline-none font-mono uppercase placeholder-gray-600 tracking-wider font-semibold"
                    required
                  />
                </div>
              </div>

              {/* CC Alphanumeric Input - LETRAS E NÚMEROS */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-gray-300 uppercase font-mono">
                    Documento de Identificação (CC) <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[9px] text-emerald-400 font-mono font-semibold">Aceita Letras e Números</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: 14785236 9 ZZ4 ou 30129481"
                    value={ccInput}
                    onChange={(e) => {
                      playClick();
                      const cleanValue = e.target.value.toUpperCase().replace(/[^A-Z0-9\s\-]/g, '');
                      setCcInput(cleanValue);
                    }}
                    maxLength={18}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none font-mono focus:border-white/30 placeholder-gray-600 font-semibold tracking-wider"
                    required
                  />
                </div>
                <p className="text-[9px] text-gray-500 font-mono">Formato permitido: Letras, números, espaços e hifens.</p>
              </div>

              {/* Motive Options Menu */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-300 uppercase font-mono">Motivo Legítimo de Apreensão</label>
                <div className="space-y-1.5">
                  {penalCode.map((item) => (
                    <label
                      key={item.op}
                      onClick={() => { playClick(); setOpcaoMotivo(item.op); }}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                        opcaoMotivo === item.op
                          ? department === 'DPSA' ? 'bg-amber-600/15 border-amber-500 text-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.1)]' :
                            department === 'DPLS' ? 'bg-blue-600/15 border-blue-500 text-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.1)]' :
                            'bg-white/10 border-white/60 text-white shadow-[0_0_8px_rgba(255,255,255,0.1)]'
                          : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="motive_option"
                        checked={opcaoMotivo === item.op}
                        onChange={() => {}}
                        className={`h-4 w-4 mt-0.5 ${department === 'DPSA' ? 'accent-amber-500' : department === 'DPLS' ? 'accent-blue-500' : 'accent-white'}`}
                      />
                      <div className="flex-1 font-mono text-[11px] leading-tight">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold mb-0.5">{item.competencia}</span>
                        <span>{item.motivo}</span>
                      </div>
                    </label>
                  ))}
                  
                  {/* Custom option */}
                  <label
                    onClick={() => { playClick(); setOpcaoMotivo("custom"); }}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                      opcaoMotivo === "custom"
                        ? 'bg-amber-600/15 border-amber-500 text-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="motive_option"
                      checked={opcaoMotivo === "custom"}
                      onChange={() => {}}
                      className="h-4 w-4 mt-0.5 accent-amber-500"
                    />
                    <div className="flex-1 font-mono text-[11px] leading-tight">
                      <span className="block text-[10px] text-gray-400 uppercase font-bold mb-0.5">Customizado</span>
                      <span>Outro - Motivo Personalizado</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Motive input field if option 'custom' is selected */}
              {opcaoMotivo === "custom" && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block text-[11px] font-bold text-amber-400 uppercase font-mono">Descreva o Motivo Personalizado</label>
                  <textarea
                    placeholder="Descreva detalhadamente o motivo para apreensão da viatura..."
                    value={customMotive}
                    onChange={(e) => {
                      playClick();
                      setCustomMotive(e.target.value);
                    }}
                    rows={2}
                    className="w-full bg-black/40 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60 font-mono"
                    required
                  />
                </div>
              )}

              {/* ADVANCED ROLEPLAY FIELDS TOGGLER */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => { playClick(); setIsAdvancedMode(!isAdvancedMode); }}
                  className="w-full py-2 px-3 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono font-bold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Sliders className={`w-3.5 h-3.5 ${accentColor}`} />
                    REGISTO AVANÇADO (DISCORD LOGS / OFICIAIS)
                  </span>
                  <span className={isAdvancedMode ? 'text-emerald-400' : 'text-gray-500'}>
                    {isAdvancedMode ? 'ATIVADO' : 'DESATIVADO'}
                  </span>
                </button>
              </div>

              {/* Advanced Inputs Drawer */}
              {isAdvancedMode && (
                <div className="space-y-3 bg-black/40 p-3 rounded-lg border border-white/10 animate-fadeIn text-xs font-mono">
                  
                  {/* Badge Number / Officer Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Identificação do Agente (Nome/Distintivo)</label>
                    <input
                      type="text"
                      placeholder="Ex: Agente Silva (DPSA-42)"
                      value={agenteInfo}
                      onChange={(e) => { playClick(); setAgenteInfo(e.target.value); }}
                      className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
                    />
                  </div>

                  {/* Occurrence Location */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Local da Ocorrência</label>
                    <input
                      type="text"
                      placeholder="Ex: Legion Square / Autoestrada de Paleto"
                      value={localidade}
                      onChange={(e) => { playClick(); setLocalidade(e.target.value); }}
                      className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Fine value (Coima) */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Coima Cobrada (€)</label>
                      <input
                        type="number"
                        placeholder="Ex: 45000"
                        value={valorMulta}
                        onChange={(e) => { playClick(); setValorMulta(e.target.value); }}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 font-mono text-yellow-400 font-bold"
                      />
                    </div>

                    {/* Impound Duration Hours */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Tempo de Retenção</label>
                      <select
                        value={tempoApreensaoHoras}
                        onChange={(e) => { playClick(); setTempoApreensaoHoras(e.target.value); }}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 font-mono"
                      >
                        <option value="12">12 Horas</option>
                        <option value="24">24 Horas (1 Dia)</option>
                        <option value="48">48 Horas (2 Dias)</option>
                        <option value="72">72 Horas (3 Dias)</option>
                        <option value="168">168 Horas (7 Dias)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit / Generate button */}
              <button
                type="submit"
                className={`w-full mt-2 py-3 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all duration-300 ${fillBtnTheme} cursor-pointer hover:scale-[1.01]`}
              >
                Gerar Relatório de Viatura
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: FILE TERMINAL VIEW & PENAL CODE */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Main Visual Terminal / Document Inspector */}
          <div className="bg-slate-950/90 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between space-y-4 flex-1 shadow-2xl">
            <div className="space-y-4 flex-1 flex flex-col">
              
              {/* Terminal Window Header Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-gray-500 font-mono text-xs px-2 select-none">|</span>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-amber-500" />
                    <span className="text-xs uppercase font-extrabold tracking-wider text-amber-500 font-mono">
                      Visualizador de Relatório (.txt)
                    </span>
                  </div>
                </div>
                {generatedReportText && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded uppercase font-bold animate-pulse font-mono tracking-wide">
                    Gerado com Sucesso!
                  </span>
                )}
              </div>

              {/* Actual Report Output Container */}
              {generatedReportText ? (
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] font-mono text-gray-400 gap-1.5">
                    <span>Ficheiro: <strong className="text-white bg-white/5 px-1.5 py-0.5 rounded">{generatedFileName}</strong></span>
                    <span className="hidden sm:inline">Codificação: <strong className="text-white">UTF-8 Plain Text</strong></span>
                  </div>

                  {/* Code Editor Interface */}
                  <div className="relative group flex-1 flex flex-col">
                    <div className="absolute right-3 top-3 text-[9px] font-mono text-gray-600 bg-neutral-900 px-1.5 py-0.5 rounded uppercase pointer-events-none border border-white/5">
                      Console Output
                    </div>
                    
                    {/* Live editable terminal textarea */}
                    <textarea
                      value={generatedReportText}
                      onChange={(e) => setGeneratedReportText(e.target.value)}
                      className="w-full flex-1 bg-black/90 p-4 rounded-lg border border-white/10 font-mono text-[11px] sm:text-xs text-yellow-400 focus:text-yellow-300 leading-relaxed overflow-y-auto select-all shadow-inner focus:outline-none focus:border-yellow-500/40 resize-none min-h-[200px]"
                      title="Pode editar o texto gerado diretamente se necessário antes de copiar"
                    />
                  </div>

                  <p className="text-[10px] text-gray-500 font-mono leading-relaxed flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>DICA: O editor acima é interativo. Pode clicar no texto para o editar manualmente ou adicionar observações adicionais antes de efetuar a cópia para as plataformas de logging.</span>
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-4">
                  <div className={`p-4 rounded-full bg-neutral-900 border border-white/5 animate-pulse ${department === 'DPSA' ? 'text-amber-500/20' : department === 'DPLS' ? 'text-blue-500/20' : 'text-white/20'}`}>
                    <FilePlus className="w-12 h-12 text-neutral-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">A aguardar parâmetros de entrada...</h4>
                    <p className="text-[11px] text-gray-500 max-w-xs mt-1 font-mono">
                      Preencha os dados do condutor e da viatura no menu lateral esquerdo e prima <strong className={accentColor}>"Gerar Relatório"</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Actions (Copy / Download) */}
            {generatedReportText && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCopiar}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-white/10 bg-neutral-900 text-xs font-bold text-white hover:bg-neutral-800 hover:border-white/20 transition-all duration-200 font-mono cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copiado para a Área de Transferência!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-4 h-4 text-gray-400" />
                      <span>Copiar Relatório de Texto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDescarregar}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-bold transition-all duration-200 font-mono cursor-pointer hover:scale-[1.01] ${
                    department === 'DPSA' ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                    department === 'DPLS' ? 'bg-blue-400 hover:bg-blue-300 text-slate-950 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 
                    'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Descarregar Ficheiro .txt</span>
                </button>
              </div>
            )}
          </div>

          {/* TABELA DO CÓDIGO PENAL E COMPETÊNCIAS - EXACT VALUES AND FORMAT REQUESTED */}
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 font-mono text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <BookOpen className="w-4.5 h-4.5" />
              <span>Tabela Oficial de Competências e Código Penal (DPSA)</span>
            </div>
            
            {/* Interactive Responsive Table */}
            <div className="overflow-x-auto border border-white/10 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-neutral-900 text-gray-300 border-b border-white/10">
                    <th className="p-2 font-bold uppercase">Competência</th>
                    <th className="p-2 font-bold uppercase">Infração / Motivo de Apreensão</th>
                    <th className="p-2 font-bold uppercase text-center">Custos</th>
                    <th className="p-2 font-bold uppercase text-right">Coima (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {penalCode.map((item) => (
                    <tr 
                      key={item.op}
                      onClick={() => {
                        playClick();
                        setOpcaoMotivo(item.op);
                      }}
                      className={`hover:bg-white/5 cursor-pointer transition-colors ${
                        opcaoMotivo === item.op 
                          ? department === 'DPSA' ? 'bg-amber-500/10 text-amber-300 font-medium' :
                            department === 'DPLS' ? 'bg-blue-500/10 text-blue-300 font-medium' :
                            'bg-white/10 text-white font-semibold'
                          : 'text-gray-400'
                      }`}
                    >
                      <td className="p-2 whitespace-nowrap font-bold text-gray-300 text-[10px]">
                        {item.competencia}
                      </td>
                      <td className="p-2 leading-snug">
                        {item.motivo}
                      </td>
                      <td className="p-2 text-center text-gray-500">
                        {item.custos}
                      </td>
                      <td className="p-2 text-right font-bold text-white whitespace-nowrap">
                        {parseInt(item.coima).toLocaleString('pt-PT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-500 text-center italic font-sans leading-snug">
              Clique numa linha da tabela para selecionar instantaneamente a infração correspondente no formulário.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER ARCHIVE: HISTORY & SEARCHABLE SESSION LOGS */}
      <section className="bg-slate-950/80 border-t border-white/10 p-4 sm:p-6 z-10 relative backdrop-blur-md">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* History Header & Search Tools */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded bg-neutral-900 border border-white/10 text-gray-300`}>
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-white font-mono">
                  Histórico Local de Apreensões ({filteredHistory.length})
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">Pesquisa e gestão de todos os relatórios gerados nesta sessão de patrulhamento.</p>
              </div>
            </div>

            {/* Action Tools for History */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative flex-1 md:w-64">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-gray-500" />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar matrícula, ID ou CC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded px-2.5 py-1.5 pl-8 text-[11px] text-white focus:outline-none focus:border-white/20 font-mono"
                />
              </div>

              {reportsHistory.length > 0 && (
                <>
                  {/* Export entire session logs button */}
                  <button
                    type="button"
                    onClick={handleExportarTodos}
                    className="bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white font-mono px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Exportar todas as apreensões geradas num só ficheiro"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Compilar Sessão (.txt)</span>
                  </button>

                  {/* Clear all history */}
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 font-mono px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Tudo</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* History Grid */}
          {reportsHistory.length > 0 ? (
            filteredHistory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {filteredHistory.map((rep) => {
                  const isCurrentlyActive = generatedFileName === rep.nomeFicheiro;
                  return (
                    <div 
                      key={rep.id}
                      onClick={() => {
                        playClick();
                        setGeneratedReportText(rep.texto);
                        setGeneratedFileName(rep.nomeFicheiro);
                      }}
                      className={`group p-3 rounded-lg border bg-black/50 hover:bg-black/80 transition-all duration-200 cursor-pointer text-xs flex flex-col justify-between space-y-2 relative ${
                        isCurrentlyActive 
                          ? `${borderHighlight} bg-neutral-900/60 shadow-[0_0_8px_rgba(245,158,11,0.1)]` 
                          : 'border-white/5'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-gray-500">
                          <span className={`px-1.5 py-0.5 rounded ${isCurrentlyActive ? 'bg-amber-400/10 text-amber-400 font-bold' : 'bg-neutral-800 text-gray-400'}`}>
                            {rep.id}
                          </span>
                          <span className="text-gray-400">{rep.dataApreensao.split(' ')[1]}</span>
                        </div>
                        
                        <p className="font-mono font-bold text-white tracking-widest text-sm flex items-center justify-between">
                          <span>{rep.matricula}</span>
                          {rep.valorMulta && (
                            <span className="text-[10px] text-emerald-400 font-bold">{parseFloat(rep.valorMulta).toLocaleString('pt-PT')}€</span>
                          )}
                        </p>
                        
                        <p className="text-[10px] text-gray-400 font-mono leading-tight truncate">
                          CC: <strong className="text-gray-200">{rep.cc}</strong>
                        </p>
                        
                        <p className="text-[10px] text-gray-500 truncate leading-none pt-1">
                          {rep.motivo}
                        </p>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] font-mono">
                        <span className="text-[9px] text-gray-500 truncate max-w-[130px]" title={rep.nomeFicheiro}>
                          {rep.nomeFicheiro}
                        </span>
                        
                        {/* Delete single button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistoryItem(rep.id, e)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar este registo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500 font-mono">Nenhum resultado corresponde à pesquisa: "{searchQuery}".</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 border border-dashed border-white/5 rounded-xl">
              <p className="text-xs text-gray-500 font-mono">O histórico de relatórios desta sessão está vazio.</p>
              <p className="text-[10px] text-gray-600 font-mono mt-1">Os relatórios criados aparecerão aqui para consultas e downloads rápidos.</p>
            </div>
          )}

        </div>
      </section>

      {/* Terminal Footer Bar */}
      <footer className="border-t border-white/5 bg-slate-950 py-3 text-center text-[10px] sm:text-xs text-gray-500 font-mono z-10 relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="flex items-center justify-center sm:justify-start gap-1">
            <ShieldAlert className="w-4 h-4 text-red-500/80 animate-pulse" />
            <span>PORTAL OFICIAL DE SEGURANÇA RODOVIÁRIA &bull; OFFSET PORTUGAL ROLEPLAY</span>
          </span>
          <span className="opacity-60 flex items-center gap-1">
            <span>© {systemTime.getFullYear()} DPSA Los Santos</span>
            <span>&bull;</span>
            <span className="text-amber-400">Codificação Segura UTF-8</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
