import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, AlertTriangle, Landmark, Radio, Users, CheckCircle2, Navigation, Clock } from 'lucide-react';
import { SeizureReport, PARQUE_LUGARES } from '../utils/data';
import { playClick, playRadioChirp, playStatic } from '../utils/audio';

interface DashboardProps {
  department: 'PSP' | 'GNR';
  officerName: string;
  officerID: string;
  seizures: SeizureReport[];
  setActiveTab: (tab: string) => void;
}

interface DispatchCall {
  id: string;
  timestamp: string;
  codigo: string;
  mensagem: string;
  localizacao: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  agentesDesignados: string[];
}

const INITIAL_DISPATCHES: DispatchCall[] = [
  {
    id: "DSP-102",
    timestamp: "Há 1 min",
    codigo: "CÓDIGO 3 (Urgente)",
    mensagem: "Assalto à mão armada em curso no Banco de Fleeca.",
    localizacao: "Banco de Fleeca (Centro)",
    prioridade: "CRITICA",
    agentesDesignados: ["PSP-1004 (Carvalho)", "PSP-3112 (Mendes)"]
  },
  {
    id: "DSP-101",
    timestamp: "Há 5 min",
    codigo: "CÓDIGO 2",
    mensagem: "Viatura em excesso de velocidade e manobras perigosas na autoestrada.",
    localizacao: "Autoestrada Del Perro (Km 12)",
    prioridade: "MEDIA",
    agentesDesignados: []
  },
  {
    id: "DSP-100",
    timestamp: "Há 12 min",
    codigo: "CÓDIGO 1",
    mensagem: "Estacionamento indevido a bloquear saída de ambulâncias no hospital de Los Santos.",
    localizacao: "Hospital de LS (Canal)",
    prioridade: "BAIXA",
    agentesDesignados: ["GNR-5011 (Pinto)"]
  }
];

const NEW_DISPATCH_TEMPLATES = [
  {
    codigo: "CÓDIGO 3 (Urgente)",
    mensagem: "Troca de tiros ativa entre gangues rivais nos blocos de Davis.",
    localizacao: "Bairro de Davis",
    prioridade: "CRITICA" as const
  },
  {
    codigo: "CÓDIGO 2",
    mensagem: "Condução sob efeito de álcool. Viatura colidiu com postes e encontra-se parada.",
    localizacao: "Sandy Shores (Posto Repsol)",
    prioridade: "MEDIA" as const
  },
  {
    codigo: "CÓDIGO 2",
    mensagem: "Venda de estupefacientes reportada por cidadão anónimo no beco de Legion Square.",
    localizacao: "Legion Square (Beco)",
    prioridade: "MEDIA" as const
  },
  {
    codigo: "CÓDIGO 3 (Urgente)",
    mensagem: "Alarme furtivo acionado na Ourivesaria Vangelico. Suspeitos armados no telhado.",
    localizacao: "Ourivesaria Vangelico (Portola Dr)",
    prioridade: "CRITICA" as const
  },
  {
    codigo: "CÓDIGO 1",
    mensagem: "Ruído excessivo e corrida ilegal de carros ('picas') perto das docas.",
    localizacao: "Porto de Los Santos (Docks)",
    prioridade: "BAIXA" as const
  }
];

export const Dashboard: React.FC<DashboardProps> = ({
  department,
  officerName,
  officerID,
  seizures,
  setActiveTab
}) => {
  const [dispatches, setDispatches] = useState<DispatchCall[]>(INITIAL_DISPATCHES);

  // Compute stats
  const activeSeizures = seizures.filter(s => s.status !== 'Libertado');
  
  const finesCollected = seizures
    .filter(s => s.status === 'Libertado')
    .reduce((sum, s) => sum + s.multa + (s.reboqueSolicitado ? 500 : 0) + 250, 0);

  const pendingFines = seizures
    .filter(s => s.status !== 'Libertado')
    .reduce((sum, s) => sum + s.multa, 0);

  const occupancyRate = Math.round((activeSeizures.length / PARQUE_LUGARES.length) * 100);

  // Simulate incoming dispatch calls every 22 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      playRadioChirp();
      setTimeout(() => playStatic(), 200);

      const template = NEW_DISPATCH_TEMPLATES[Math.floor(Math.random() * NEW_DISPATCH_TEMPLATES.length)];
      const newDispatch: DispatchCall = {
        id: `DSP-${Math.floor(103 + Math.random() * 900)}`,
        timestamp: "Agora mesmo",
        codigo: template.codigo,
        mensagem: template.mensagem,
        localizacao: template.localizacao,
        prioridade: template.prioridade,
        agentesDesignados: []
      };

      setDispatches(prev => [newDispatch, ...prev.slice(0, 5)]);
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeDispatch = (id: string) => {
    playRadioChirp();
    setTimeout(() => playStatic(), 150);

    setDispatches(prev => prev.map(d => {
      if (d.id === id) {
        const signature = `${officerID} (${officerName})`;
        if (d.agentesDesignados.includes(signature)) {
          // Remove if already assigned
          return {
            ...d,
            agentesDesignados: d.agentesDesignados.filter(a => a !== signature)
          };
        } else {
          // Add assignment
          return {
            ...d,
            agentesDesignados: [...d.agentesDesignados, signature]
          };
        }
      }
      return d;
    }));
  };

  // Seizures breakdown by type
  const motiveCounts = { assalto: 0, fuga: 0, carta: 0, investigacao: 0, outro: 0 };
  seizures.forEach(s => {
    if (s.motivo.includes('assalto')) motiveCounts.assalto++;
    else if (s.motivo.includes('fuga')) motiveCounts.fuga++;
    else if (s.motivo.includes('carta')) motiveCounts.carta++;
    else if (s.motivo.includes('investigação')) motiveCounts.investigacao++;
    else motiveCounts.outro++;
  });

  const totalBreakdown = Object.values(motiveCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Officer Welcome bar */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md bg-black/40 ${
        department === 'PSP' ? 'border-blue-500/30' : 'border-emerald-500/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            department === 'PSP' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Bem-vindo, {department === 'PSP' ? 'Agente' : 'Guarda'} {officerName || 'Silva'}
            </h1>
            <p className="text-xs text-gray-400 font-sans">
              Terminal Operacional de Trânsito &bull; Corporação: <strong className="text-gray-300 font-semibold">{department} Portugal</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right hidden sm:block">
            <span className="text-gray-500">Canal Rádio:</span>
            <p className="text-emerald-400 font-bold animate-pulse">PSP/GNR-NET SECURE</p>
          </div>
          <button
            onClick={() => {
              playClick();
              setActiveTab('form');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold text-black uppercase tracking-wider transition-all duration-300 ${
              department === 'PSP'
                ? 'bg-blue-400 hover:bg-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                : 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
            }`}
          >
            + Nova Apreensão
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-black/30 backdrop-blur-md p-5 rounded-xl border border-white/5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">Apreensões Ativas</span>
            <p className="text-3xl font-extrabold text-white font-mono">{activeSeizures.length}</p>
            <span className="text-[10px] text-gray-400">No parque municipal</span>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-black/30 backdrop-blur-md p-5 rounded-xl border border-white/5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">Capacidade Parque</span>
            <p className="text-3xl font-extrabold text-white font-mono">{occupancyRate}%</p>
            <span className="text-[10px] text-gray-400">{activeSeizures.length} de {PARQUE_LUGARES.length} lugares</span>
          </div>
          <div className={`p-3 rounded-lg ${occupancyRate > 75 ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-black/30 backdrop-blur-md p-5 rounded-xl border border-white/5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">Coimas Pendentes</span>
            <p className="text-3xl font-extrabold text-yellow-500 font-mono">{pendingFines.toLocaleString()} €</p>
            <span className="text-[10px] text-gray-400">Total a liquidar por infratores</span>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-black/30 backdrop-blur-md p-5 rounded-xl border border-white/5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">Fundos Arrecadados</span>
            <p className="text-3xl font-extrabold text-emerald-400 font-mono">{finesCollected.toLocaleString()} €</p>
            <span className="text-[10px] text-gray-400">Coimas liquidadas com sucesso</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts and Bulletins */}
        <div className="lg:col-span-2 space-y-6">
          {/* Diagrams box */}
          <div className="bg-black/30 backdrop-blur-md p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">
              Distribuição por Motivo de Apreensão
            </h3>
            
            {/* Custom Interactive SVG charts / CSS bars */}
            <div className="space-y-3 pt-2">
              {/* Bar 1 - Assault */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-semibold">Fuga às Autoridades (Opção 2)</span>
                  <span className="text-gray-400 font-mono">{Math.round((motiveCounts.fuga / totalBreakdown) * 100)}% ({motiveCounts.fuga})</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ width: `${Math.max(4, (motiveCounts.fuga / totalBreakdown) * 100)}%` }} />
                </div>
              </div>

              {/* Bar 2 - Robbery */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-semibold">Envolvimento em Assalto (Opção 1)</span>
                  <span className="text-gray-400 font-mono">{Math.round((motiveCounts.assalto / totalBreakdown) * 100)}% ({motiveCounts.assalto})</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" style={{ width: `${Math.max(4, (motiveCounts.assalto / totalBreakdown) * 100)}%` }} />
                </div>
              </div>

              {/* Bar 3 - No driving license */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-semibold">Sem Habilitação Legal / Carta (Opção 3)</span>
                  <span className="text-gray-400 font-mono">{Math.round((motiveCounts.carta / totalBreakdown) * 100)}% ({motiveCounts.carta})</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${Math.max(4, (motiveCounts.carta / totalBreakdown) * 100)}%` }} />
                </div>
              </div>

              {/* Bar 4 - Investigation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-semibold">Sob Investigação Policial (Opção 4)</span>
                  <span className="text-gray-400 font-mono">{Math.round((motiveCounts.investigacao / totalBreakdown) * 100)}% ({motiveCounts.investigacao})</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]" style={{ width: `${Math.max(4, (motiveCounts.investigacao / totalBreakdown) * 100)}%` }} />
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-500 font-sans italic pt-2">
              * Dados gerados com base em relatórios registados neste terminal policial.
            </p>
          </div>

          {/* Daily announcement bulletin */}
          <div className="bg-black/30 backdrop-blur-md p-5 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Diretrizes Ativas de Patrulha
            </h3>
            <ul className="space-y-3 text-xs text-gray-300">
              <li className="flex gap-2.5 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                <div>
                  <strong className="text-white">Operação Stop Ativa:</strong> Patrulha rodoviária reforçada na zona circundante da Garagem Central para combater veículos sem matricula ou alterados ilegalmente.
                </div>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <strong className="text-white">Relatórios de CC Obrigatórios:</strong> A falta de validação do CC do proprietário antes de rebocar anulará a legalidade do ato, passível de ação disciplinar pela corregedoria policial do Offset Portugal.
                </div>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5" />
                <div>
                  <strong className="text-white">Veículos de Assalto:</strong> Qualquer viatura capturada em flagrante delito num assalto deve ser revistada para apreensão de armas e substâncias antes de ser rebocada para o Parque de Apreensões.
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Live Radio CAD Dispatches */}
        <div className="bg-neutral-950/80 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col h-[480px] justify-between shadow-lg">
          <div className="space-y-4 overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-red-500">
                  Central CAD Rádio (Live)
                </span>
              </div>
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase animate-pulse flex items-center gap-1">
                <span>●</span> ESCUTA ATIVA
              </span>
            </div>

            {/* Scrollable list */}
            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              {dispatches.map((disp) => (
                <div
                  key={disp.id}
                  className={`p-3 rounded-lg border text-xs space-y-2 transition-all duration-300 hover:bg-white/5 ${
                    disp.prioridade === 'CRITICA'
                      ? 'bg-red-500/5 border-red-500/20'
                      : disp.prioridade === 'MEDIA'
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-blue-500/5 border-blue-500/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] font-bold text-gray-500">{disp.id} &bull; {disp.timestamp}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      disp.prioridade === 'CRITICA'
                        ? 'bg-red-500/20 text-red-400'
                        : disp.prioridade === 'MEDIA'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {disp.codigo}
                    </span>
                  </div>

                  <p className="text-gray-200 font-sans leading-relaxed">{disp.mensagem}</p>

                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Navigation className="w-3 h-3 flex-shrink-0 text-red-400" />
                    <span className="font-semibold">{disp.localizacao}</span>
                  </div>

                  {/* Agents designated */}
                  {disp.agentesDesignados.length > 0 && (
                    <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1 items-center">
                      <span className="text-[9px] uppercase text-gray-500 font-extrabold mr-1">Designados:</span>
                      {disp.agentesDesignados.map((ag) => (
                        <span key={ag} className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          {ag.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Acknowledge dispatch action */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleAcknowledgeDispatch(disp.id)}
                      className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded border transition-all duration-200 ${
                        disp.agentesDesignados.includes(`${officerID} (${officerName})`)
                          ? 'bg-emerald-500 text-neutral-950 border-emerald-500 hover:bg-emerald-400'
                          : 'bg-neutral-900 text-gray-300 border-white/10 hover:border-white/30 hover:bg-neutral-800'
                      }`}
                    >
                      {disp.agentesDesignados.includes(`${officerID} (${officerName})`)
                        ? 'A Caminho (Cancelar)'
                        : 'Responder ao Chamado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 text-center text-[10px] text-gray-500 font-sans flex items-center justify-center gap-1 select-none">
            <Clock className="w-3.5 h-3.5" />
            <span>Despachos sincronizados com a Base de Dados Central do Servidor</span>
          </div>
        </div>
      </div>
    </div>
  );
};
