import React, { useState } from 'react';
import { Shield, MapPin, CheckCircle, Navigation, Info, Move, X } from 'lucide-react';
import { SeizureReport, PARQUE_LUGARES } from '../utils/data';
import { playClick, playSuccess, playWarning } from '../utils/audio';

interface CompoundMapProps {
  department: 'PSP' | 'GNR';
  seizures: SeizureReport[];
  onRelocateSeizure: (id: string, newSpot: string) => void;
  setActiveTab: (tab: string) => void;
}

export const CompoundMap: React.FC<CompoundMapProps> = ({
  department,
  seizures,
  onRelocateSeizure,
  setActiveTab
}) => {
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [isRelocating, setIsRelocating] = useState(false);
  const [targetRelocationSpot, setTargetRelocationSpot] = useState('');

  // Get active (not released) seizures
  const activeSeizures = seizures.filter(s => s.status !== 'Libertado');

  // Find seizure parked at a specific spot
  const getSeizureAtSpot = (spot: string) => {
    return activeSeizures.find(s => s.lugarParque === spot);
  };

  const handleSpotClick = (spot: string) => {
    playClick();
    setSelectedSpot(spot);
    setIsRelocating(false);
  };

  const handleStartRelocation = () => {
    playClick();
    setIsRelocating(true);
    // Find first vacant spot
    const occupiedSpots = activeSeizures.map(s => s.lugarParque);
    const vacantSpot = PARQUE_LUGARES.find(s => !occupiedSpots.includes(s)) || '';
    setTargetRelocationSpot(vacantSpot);
  };

  const handleConfirmRelocation = (seizureId: string) => {
    if (!targetRelocationSpot) {
      playWarning();
      return;
    }
    playSuccess();
    onRelocateSeizure(seizureId, targetRelocationSpot);
    setIsRelocating(false);
    setSelectedSpot(targetRelocationSpot); // Follow vehicle to its new spot
  };

  // Group slots by row letter (A, B, C, D)
  const rows = ['A', 'B', 'C', 'D'];
  const cols = [1, 2, 3, 4, 5];

  const currentSeizure = selectedSpot ? getSeizureAtSpot(selectedSpot) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-white flex items-center gap-2">
            <MapPin className={`w-7 h-7 ${department === 'PSP' ? 'text-blue-400' : 'text-emerald-400'}`} />
            MAPA DO PARQUE DE APREENSÕES
          </h2>
          <p className="text-sm text-gray-400">Layout interativo de vagas. Clique num lugar para gerir a viatura estacionada</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded border border-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-gray-300">Levantamento</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded border border-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span className="text-gray-300">Apreendido</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded border border-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-gray-300">Investigação</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded border border-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-600"></span>
            <span className="text-gray-300">Lugar Livre</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parking Grid map */}
        <div className="lg:col-span-2 bg-black/30 backdrop-blur-md border border-white/5 p-6 rounded-xl flex flex-col justify-center">
          <div className="text-center text-xs text-gray-500 font-bold uppercase tracking-widest border-b border-white/5 pb-3 mb-6 flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4 text-gray-400 rotate-45" />
            ZONA OPERACIONAL: PARQUE DE VIATURAS RETIDAS
          </div>

          <div className="space-y-4">
            {rows.map(row => (
              <div key={row} className="flex items-center gap-3">
                {/* Row Label */}
                <div className="w-8 h-12 flex items-center justify-center font-mono font-black text-sm text-gray-500 bg-neutral-900 border border-white/5 rounded-lg">
                  {row}
                </div>

                {/* Slots */}
                <div className="grid grid-cols-5 gap-3.5 flex-1">
                  {cols.map(col => {
                    const spot = `${row}${col}`;
                    const seizure = getSeizureAtSpot(spot);
                    
                    // Style by seizure state
                    let spotStyles = "border-neutral-800 text-neutral-500 bg-neutral-950/40 hover:bg-white/5 hover:border-neutral-700";
                    let labelColor = "text-neutral-500";

                    if (seizure) {
                      if (seizure.status === 'Pronto para Levantamento') {
                        spotStyles = "border-emerald-500/30 text-emerald-300 bg-emerald-950/25 hover:bg-emerald-950/40 hover:border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.05)]";
                        labelColor = "text-emerald-400";
                      } else if (seizure.status === 'Sob Investigação') {
                        spotStyles = "border-red-500/30 text-red-300 bg-red-950/25 hover:bg-red-950/40 hover:border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.05)]";
                        labelColor = "text-red-400";
                      } else {
                        spotStyles = "border-yellow-500/30 text-yellow-300 bg-yellow-950/25 hover:bg-yellow-950/40 hover:border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.05)]";
                        labelColor = "text-yellow-400";
                      }
                    }

                    const isSelected = selectedSpot === spot;

                    return (
                      <button
                        key={spot}
                        onClick={() => handleSpotClick(spot)}
                        className={`h-16 rounded-xl border flex flex-col items-center justify-between p-2 font-mono text-xs transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 ${spotStyles} ${
                          isSelected ? 'ring-2 ring-white/65 scale-[1.03] border-white/30 z-10' : ''
                        }`}
                      >
                        <div className="flex justify-between w-full">
                          <span className={`font-black ${labelColor}`}>{spot}</span>
                          {seizure && (
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                          )}
                        </div>
                        {seizure ? (
                          <div className="text-[10px] truncate max-w-full font-bold uppercase text-white font-mono">
                            {seizure.matricula.replace('VA-', '')}
                          </div>
                        ) : (
                          <span className="text-[8px] tracking-wider uppercase text-neutral-600 font-bold">LIVRE</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>As vagas são preenchidas de forma dinâmica ao redigir o auto de apreensão</span>
          </div>
        </div>

        {/* Spot details panel */}
        <div className="bg-neutral-950/80 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between h-full min-h-[300px]">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">
                Informações do Lugar
              </span>
              {selectedSpot && (
                <span className="font-mono text-xs font-bold text-white bg-neutral-950 border border-white/5 px-2.5 py-0.5 rounded">
                  Vaga {selectedSpot}
                </span>
              )}
            </div>

            {selectedSpot ? (
              currentSeizure ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 font-sans">Viatura Estacionada</span>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="border border-white/20 bg-neutral-900 px-3 py-1 rounded font-mono text-xs font-bold text-white">
                        {currentSeizure.matricula}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-xs">
                    <div>
                      <span className="text-gray-500">Cartão de Cidadão (CC):</span>
                      <p className="font-mono text-gray-300">{currentSeizure.proprietarioCC}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Motivo de Retenção:</span>
                      <p className="text-yellow-400 font-semibold">{currentSeizure.motivo}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Agente Responsável:</span>
                      <p className="text-gray-300">{currentSeizure.agenteResponsavel} ({currentSeizure.agenteID})</p>
                    </div>
                  </div>

                  {/* Spot Relocation Section */}
                  {isRelocating ? (
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <label className="block text-xs font-semibold text-gray-300 uppercase">Mudar para Vaga:</label>
                      <div className="flex gap-2">
                        <select
                          value={targetRelocationSpot}
                          onChange={(e) => setTargetRelocationSpot(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          {PARQUE_LUGARES.map(spot => {
                            const isOccupied = activeSeizures.some(s => s.lugarParque === spot);
                            if (isOccupied) return null;
                            return (
                              <option key={spot} value={spot} className="bg-neutral-900 text-white">
                                Vaga {spot} (Vazia)
                              </option>
                            );
                          })}
                        </select>
                        <button
                          onClick={() => handleConfirmRelocation(currentSeizure.id)}
                          className={`px-3 py-1.5 rounded text-xs font-bold text-black ${
                            department === 'PSP' ? 'bg-blue-400 hover:bg-blue-300' : 'bg-emerald-400 hover:bg-emerald-300'
                          }`}
                        >
                          Mudar
                        </button>
                        <button
                          onClick={() => setIsRelocating(false)}
                          className="px-2.5 py-1.5 rounded text-xs font-bold border border-white/10 text-gray-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartRelocation}
                      className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-neutral-900 border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-neutral-800 transition-all duration-200 mt-4"
                    >
                      <Move className="w-3.5 h-3.5 text-gray-400" />
                      <span>Re-alocar Lugar de Parque</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 text-xs space-y-2 flex flex-col items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500/60" />
                  <div>
                    <h4 className="font-bold text-gray-400">Esta vaga está vazia</h4>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                      Não há nenhum veículo apreendido estacionado no lugar <strong>{selectedSpot}</strong>.
                    </p>
                    <button
                      onClick={() => {
                        playClick();
                        setActiveTab('form');
                      }}
                      className="mt-3.5 text-[10px] font-bold text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded px-2.5 py-1"
                    >
                      Registar nova viatura aqui
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="py-20 text-center text-gray-500 text-xs space-y-2">
                <Shield className="w-10 h-10 text-neutral-600 mx-auto animate-pulse" />
                <p>Nenhuma vaga selecionada.</p>
                <p className="text-[10px] text-neutral-600 max-w-[200px] mx-auto leading-relaxed">
                  Clique em qualquer lugar no mapa do parque municipal à esquerda para aceder à ficha do veículo e comandos.
                </p>
              </div>
            )}
          </div>

          {selectedSpot && currentSeizure && (
            <button
              onClick={() => {
                playClick();
                setActiveTab('list');
              }}
              className="w-full mt-6 py-2 border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-all duration-200 text-center block"
            >
              Ver na Tabela Completa →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
