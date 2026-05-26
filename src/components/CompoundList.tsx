import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Clock, Download, Clipboard, Check, Eye, ShieldCheck, Key, FileText, X } from 'lucide-react';
import { SeizureReport } from '../utils/data';
import { playClick, playSuccess, playRadioChirp } from '../utils/audio';

interface CompoundListProps {
  department: 'PSP' | 'GNR';
  seizures: SeizureReport[];
  onReleaseSeizure: (id: string) => void;
  onUpdateSeizureStatus: (id: string, status: SeizureReport['status']) => void;
}

export const CompoundList: React.FC<CompoundListProps> = ({
  department,
  seizures,
  onReleaseSeizure,
  onUpdateSeizureStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tudo' | 'Apreendido' | 'Pronto para Levantamento' | 'Sob Investigação' | 'Libertado'>('Tudo');
  
  // Real-time ticking state for live countdowns
  const [timeTick, setTimeTick] = useState(new Date());

  // Modal States
  const [selectedSeizure, setSelectedSeizure] = useState<SeizureReport | null>(null);
  const [viewReportMode, setViewReportMode] = useState(false);
  const [releaseModalMode, setReleaseModalMode] = useState(false);
  const [finePaidSimulation, setFinePaidSimulation] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tick timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    playSuccess();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to calculate countdown time remaining
  const getRemainingTime = (isoString: string, status: SeizureReport['status']) => {
    if (status === 'Libertado') return { text: 'N/A (Libertado)', totalSec: 0, isOver: true };
    if (status === 'Sob Investigação') return { text: 'Retido p/ Investigação', totalSec: 999999, isOver: false };

    const target = new Date(isoString).getTime();
    const now = timeTick.getTime();
    const diff = target - now;

    if (diff <= 0) {
      return { text: 'Elegível p/ Levantamento', totalSec: 0, isOver: true };
    }

    const totalSec = Math.floor(diff / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const formatted = `${hrs}h ${mins}m ${secs}s`;
    return { text: formatted, totalSec, isOver: false };
  };

  // Auto transition seizures whose countdown timer has elapsed from 'Apreendido' to 'Pronto para Levantamento'
  useEffect(() => {
    seizures.forEach(s => {
      if (s.status === 'Apreendido') {
        const timeObj = getRemainingTime(s.dataLevantamento, s.status);
        if (timeObj.isOver && timeObj.totalSec === 0) {
          onUpdateSeizureStatus(s.id, 'Pronto para Levantamento');
        }
      }
    });
  }, [timeTick, seizures, onUpdateSeizureStatus]);

  const filteredSeizures = seizures.filter(s => {
    const matchesSearch = 
      s.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.proprietarioCC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'Tudo') return true;
    return s.status === statusFilter;
  });

  const triggerViewReport = (seizure: SeizureReport) => {
    playClick();
    setSelectedSeizure(seizure);
    setViewReportMode(true);
    setReleaseModalMode(false);
  };

  const triggerReleaseModal = (seizure: SeizureReport) => {
    playClick();
    setSelectedSeizure(seizure);
    setReleaseModalMode(true);
    setViewReportMode(false);
    setFinePaidSimulation(false);
  };

  const confirmRelease = () => {
    if (!selectedSeizure) return;
    playRadioChirp();
    onReleaseSeizure(selectedSeizure.id);
    setFinePaidSimulation(true);
    
    // Close modal after showing receipt for 4 seconds
    setTimeout(() => {
      setReleaseModalMode(false);
      setSelectedSeizure(null);
    }, 4500);
  };

  const generateReportText = (s: SeizureReport) => {
    return (
      `\n${s.matricula}\n` +
      `Viatura Apreendida\n\n` +
      `Número de CC: ${s.proprietarioCC}\n` +
      `Motivo da Apreensão: ${s.motivo}\n\n` +
      `Nota: Levantar dia ${new Date(s.dataLevantamento).toLocaleDateString('pt-PT')} às ${s.horaLevantamento}\n`
    );
  };

  const downloadReportFile = (s: SeizureReport) => {
    playSuccess();
    const text = generateReportText(s);
    const filename = `Relatorio_${s.matricula}${s.versao > 1 ? `_${s.versao - 1}` : ''}.txt`;
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-white">PARQUE DE APREENSÕES DE VIATURAS</h2>
          <p className="text-sm text-gray-400">Pesquise, verifique tempos de custódia e processe a liberação de veículos apreendidos</p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900/60 border border-white/5 px-4 py-2 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
          <span className="text-xs font-mono text-gray-300">Viaturas Ativas: {seizures.filter(s => s.status !== 'Libertado').length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrar por matrícula, CC ou ID..."
            value={searchTerm}
            onChange={(e) => {
              playClick();
              setSearchTerm(e.target.value);
            }}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="md:col-span-2 flex flex-wrap gap-2 md:justify-end">
          {(['Tudo', 'Apreendido', 'Pronto para Levantamento', 'Sob Investigação', 'Libertado'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                playClick();
                setStatusFilter(status);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
                statusFilter === status
                  ? department === 'PSP'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                    : 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Seizure Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSeizures.length > 0 ? (
          filteredSeizures.map((s) => {
            const timeObj = getRemainingTime(s.dataLevantamento, s.status);
            return (
              <div
                key={s.id}
                className={`group rounded-xl border bg-black/30 backdrop-blur-md p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  s.status === 'Libertado'
                    ? 'border-white/5 opacity-60'
                    : s.status === 'Sob Investigação'
                    ? 'border-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.05)]'
                    : s.status === 'Pronto para Levantamento'
                    ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                    : department === 'PSP'
                    ? 'border-blue-500/15 hover:border-blue-500/30'
                    : 'border-emerald-500/15 hover:border-emerald-500/30'
                }`}
              >
                {/* Badge decoration */}
                <div className={`absolute top-0 right-0 h-1.5 w-full ${
                  s.status === 'Libertado'
                    ? 'bg-gray-600'
                    : s.status === 'Sob Investigação'
                    ? 'bg-red-500'
                    : s.status === 'Pronto para Levantamento'
                    ? 'bg-emerald-500'
                    : 'bg-yellow-500'
                }`} />

                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-500 font-bold">{s.id}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      s.status === 'Libertado'
                        ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        : s.status === 'Sob Investigação'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : s.status === 'Pronto para Levantamento'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold animate-pulse'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  {/* Visual Plate License */}
                  <div className="flex items-center gap-3">
                    <div className="border border-white/20 bg-neutral-900 px-3 py-1.5 rounded font-mono text-sm font-bold tracking-wider text-white flex items-center shadow-inner select-none">
                      <div className="w-1.5 h-full mr-2 bg-blue-700 flex flex-col justify-between py-0.5 rounded-l text-[6px] text-white">
                        <span>EU</span>
                        <span>PT</span>
                      </div>
                      {s.matricula}
                    </div>
                  </div>

                  {/* Details info */}
                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-xs text-gray-300">
                    <div>
                      <span className="text-gray-500">Cartão de Cidadão (CC):</span>{' '}
                      <span className="font-mono text-gray-200">{s.proprietarioCC}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Local de Apreensão:</span>{' '}
                      <span className="text-gray-200">{s.localApreensao}</span>
                    </div>
                    <div className="line-clamp-1 text-gray-400 italic">
                      "{s.motivo}"
                    </div>
                  </div>
                </div>

                {/* Interactive Countdown / Status */}
                <div className={`mt-4 p-3 rounded-lg border flex items-center gap-2.5 ${
                  s.status === 'Libertado'
                    ? 'bg-neutral-900/40 border-white/5 text-gray-500'
                    : s.status === 'Sob Investigação'
                    ? 'bg-red-500/5 border-red-500/10 text-red-400'
                    : s.status === 'Pronto para Levantamento'
                    ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                    : 'bg-yellow-500/5 border-yellow-500/15 text-yellow-400'
                }`}>
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <div className="text-xs font-mono">
                    <p className="text-[10px] uppercase font-sans font-bold text-gray-500 leading-none mb-0.5">Tempo p/ Liberação</p>
                    <p className="font-bold tracking-wide">{timeObj.text}</p>
                  </div>
                </div>

                {/* Actions buttons */}
                <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => triggerViewReport(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-neutral-900 border border-white/5 text-xs font-bold text-gray-300 hover:text-white hover:bg-neutral-800 transition-all duration-200"
                    title="Visualizar Relatório de Auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Auto .txt</span>
                  </button>

                  {s.status !== 'Libertado' && (
                    <button
                      onClick={() => triggerReleaseModal(s)}
                      disabled={s.status === 'Sob Investigação'}
                      className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                        s.status === 'Sob Investigação'
                          ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 cursor-not-allowed'
                          : s.status === 'Pronto para Levantamento'
                          ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Libertar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-xl bg-black/10">
            <ShieldAlert className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-400">Nenhum veículo apreendido</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">Nenhum registo de viatura corresponde aos critérios de pesquisa ou filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* VIEW REPORT DIALOG POPUP */}
      {viewReportMode && selectedSeizure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-white/10 rounded-xl w-full max-w-lg p-5 flex flex-col justify-between shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm uppercase font-bold text-white tracking-wide">
                    Auto Policial de Apreensão
                  </span>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    setViewReportMode(false);
                    setSelectedSeizure(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>ID: <strong className="text-white">{selectedSeizure.id}</strong></span>
                  <span>Ficheiro: <strong className="text-white">Relatorio_{selectedSeizure.matricula}.txt</strong></span>
                </div>

                <div className="bg-black p-4 rounded-lg border border-white/10 font-mono text-xs text-yellow-400 whitespace-pre-wrap select-all max-h-72 overflow-y-auto leading-relaxed shadow-inner">
                  {generateReportText(selectedSeizure)}
                </div>

                {/* Additional Info */}
                <div className="p-3 bg-white/5 rounded-lg text-xs space-y-1.5 text-gray-300">
                  <p><strong className="text-white">Agente Autuante:</strong> {selectedSeizure.agenteResponsavel} ({selectedSeizure.agenteID})</p>
                  <p><strong className="text-white">Lugar de Parque:</strong> Lugar {selectedSeizure.lugarParque}</p>
                  {selectedSeizure.observacoes && (
                    <p><strong className="text-white">Observações:</strong> <span className="italic">"{selectedSeizure.observacoes}"</span></p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 mt-5">
              <button
                onClick={() => handleCopyText(generateReportText(selectedSeizure), selectedSeizure.id)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-white/10 bg-neutral-900 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
              >
                {copiedId === selectedSeizure.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-4 h-4 text-gray-400" />
                    <span>Copiar Auto</span>
                  </>
                )}
              </button>

              <button
                onClick={() => downloadReportFile(selectedSeizure)}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold text-black transition-colors ${
                  department === 'PSP' ? 'bg-blue-400 hover:bg-blue-300' : 'bg-emerald-400 hover:bg-emerald-300'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Descarregar .txt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RELEASE BILLING DIALOG MODAL */}
      {releaseModalMode && selectedSeizure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-white/10 rounded-xl w-full max-w-lg p-5 flex flex-col justify-between shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm uppercase font-bold text-white tracking-wide">
                    Guia de Levantamento Policial
                  </span>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    setReleaseModalMode(false);
                    setSelectedSeizure(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  disabled={finePaidSimulation}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!finePaidSimulation ? (
                <div className="space-y-4">
                  <div className="bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-lg space-y-2">
                    <p className="text-xs text-emerald-400 font-extrabold uppercase tracking-wide">Valores a cobrar ao proprietário:</p>
                    <div className="flex justify-between items-center text-sm font-bold text-white">
                      <span>Coima Principal ({selectedSeizure.id}):</span>
                      <span className="font-mono text-emerald-300">{selectedSeizure.multa.toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 pt-1.5 border-t border-white/5">
                      <span>Taxa de Reboque PSP/GNR:</span>
                      <span>{selectedSeizure.reboqueSolicitado ? '500 €' : '0 € (Conduzido ao parque)'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Taxa Diária de Parqueamento:</span>
                      <span>250 € / dia (1 dia registado)</span>
                    </div>
                    <div className="flex justify-between items-center text-base font-extrabold text-white pt-2 border-t border-white/10">
                      <span>Total Liquidar:</span>
                      <span className="font-mono text-emerald-400">
                        {(selectedSeizure.multa + (selectedSeizure.reboqueSolicitado ? 500 : 0) + 250).toLocaleString()} €
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-300 bg-white/5 p-3 rounded-lg">
                    <p><strong className="text-white">Matrícula:</strong> {selectedSeizure.matricula}</p>
                    <p><strong className="text-white">Proprietário (CC):</strong> {selectedSeizure.proprietarioCC}</p>
                    <p><strong className="text-white">Lugar de Parque:</strong> Lugar {selectedSeizure.lugarParque}</p>
                  </div>

                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-[11px] text-yellow-300 leading-relaxed">
                    <strong>Atenção:</strong> Ao clicar em "Confirmar Pagamento e Libertar", simula-se o depósito da coima na conta pública do Estado. A vaga <strong>{selectedSeizure.lugarParque}</strong> do parque de apreensões ficará imediatamente livre e disponível para outra viatura.
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Transação Concluída com Sucesso!</h3>
                    <p className="text-xs text-emerald-400 font-bold mt-1">Coima liquidada no sistema da PSP/GNR</p>
                  </div>

                  <div className="p-4 bg-black rounded-lg border border-white/10 font-mono text-left text-[11px] text-gray-300 leading-relaxed max-w-sm mx-auto shadow-inner">
                    <p className="text-center font-bold text-white uppercase border-b border-white/10 pb-1.5 mb-1.5">TALÃO DE RECOLHA OFICIAL</p>
                    <p><strong>Nº Talão:</strong> REC-{Math.floor(100000 + Math.random() * 900000)}</p>
                    <p><strong>Matrícula:</strong> {selectedSeizure.matricula}</p>
                    <p><strong>Proprietário (CC):</strong> {selectedSeizure.proprietarioCC}</p>
                    <p><strong>Coima Base:</strong> {selectedSeizure.multa.toLocaleString()} €</p>
                    <p><strong>Total Pago:</strong> {(selectedSeizure.multa + (selectedSeizure.reboqueSolicitado ? 500 : 0) + 250).toLocaleString()} €</p>
                    <p className="border-t border-dashed border-white/20 pt-1 mt-1 text-center text-emerald-400 font-bold uppercase">ESTADO: LEVANTAMENTO AUTORIZADO</p>
                  </div>
                  <p className="text-[10px] text-gray-500">A fechar guia automática de levantamento...</p>
                </div>
              )}
            </div>

            {!finePaidSimulation && (
              <div className="flex gap-3 pt-4 border-t border-white/10 mt-5">
                <button
                  onClick={() => {
                    playClick();
                    setReleaseModalMode(false);
                    setSelectedSeizure(null);
                  }}
                  className="flex-1 p-2 rounded-lg border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRelease}
                  className="flex-1 p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-extrabold text-neutral-950 transition-colors"
                >
                  Confirmar Pagamento e Libertar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
