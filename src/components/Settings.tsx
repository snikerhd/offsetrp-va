import React, { useEffect } from 'react';
import { Shield, Volume2, VolumeX, User, CheckCircle } from 'lucide-react';
import { OFFICER_RANKS } from '../utils/data';
import { playClick, playSuccess, setSoundEnabled } from '../utils/audio';

interface SettingsProps {
  department: 'PSP' | 'GNR';
  setDepartment: (dept: 'PSP' | 'GNR') => void;
  officerName: string;
  setOfficerName: (name: string) => void;
  officerID: string;
  setOfficerID: (id: string) => void;
  officerRank: string;
  setOfficerRank: (rank: string) => void;
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  department,
  setDepartment,
  officerName,
  setOfficerName,
  officerID,
  setOfficerID,
  officerRank,
  setOfficerRank,
  soundOn,
  setSoundOn,
}) => {
  const currentRanks = department === 'PSP' ? OFFICER_RANKS.PSP : OFFICER_RANKS.GNR;

  // Ensure rank is valid when department changes
  useEffect(() => {
    if (!currentRanks.includes(officerRank)) {
      setOfficerRank(currentRanks[0]);
    }
  }, [department, currentRanks, officerRank, setOfficerRank]);

  const handleDeptChange = (dept: 'PSP' | 'GNR') => {
    playClick();
    setDepartment(dept);
    // Set a default rank for the new department
    setOfficerRank(OFFICER_RANKS[dept][0]);
    // Set a default prefix
    if (!officerID.startsWith(dept)) {
      const numOnly = officerID.replace(/[^0-9]/g, '');
      setOfficerID(`${dept}-${numOnly || '1004'}`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccess();
    // Save to localStorage or show message
    const alertBox = document.getElementById('save-alert');
    if (alertBox) {
      alertBox.classList.remove('opacity-0');
      setTimeout(() => {
        alertBox.classList.add('opacity-0');
      }, 3000);
    }
  };

  const toggleSound = () => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    setSoundEnabled(newVal);
    if (newVal) {
      setTimeout(() => playSuccess(), 100);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-white">DEFINIÇÕES DE AGENTE</h2>
          <p className="text-sm text-gray-400">Configure as credenciais e as preferências do terminal policial</p>
        </div>
        <Shield className={`w-8 h-8 ${department === 'PSP' ? 'text-blue-400 animate-pulse' : 'text-emerald-400 animate-pulse'}`} />
      </div>

      <div id="save-alert" className="opacity-0 transition-opacity duration-300 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 p-4 rounded-lg flex items-center gap-3">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span>Credenciais atualizadas com sucesso! Os relatórios gerados agora serão assinados com estes dados.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Badge preview */}
        <div className={`rounded-xl border p-6 flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-md bg-black/40 ${
          department === 'PSP' ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
        }`}>
          <div className={`w-28 h-28 rounded-full border-2 flex items-center justify-center ${
            department === 'PSP' ? 'border-blue-400 bg-blue-950/40 text-blue-300' : 'border-emerald-400 bg-emerald-950/40 text-emerald-300'
          }`}>
            <Shield className="w-16 h-16" />
          </div>
          <div>
            <span className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full ${
              department === 'PSP' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {department === 'PSP' ? 'Polícia de Segurança Pública' : 'Guarda Nacional Republicana'}
            </span>
            <h3 className="text-xl font-bold mt-3 text-white">
              {officerRank} {officerName || "Silva"}
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-1">ID: {officerID || "PSP-2490"}</p>
          </div>
          <div className="w-full pt-4 border-t border-white/10 text-left">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-gray-400">Jurisdição:</span>
              <span className="text-white font-medium text-right">Portugal / Offset RP</span>
              <span className="text-gray-400">Estado de Serviço:</span>
              <span className="text-emerald-400 font-bold text-right animate-pulse">● EM SERVIÇO</span>
              <span className="text-gray-400">Canal Rádio:</span>
              <span className="text-white font-mono text-right">CODU PSP 1</span>
            </div>
          </div>
        </div>

        {/* Right Columns: Forms */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6 bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Identidade Policial
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-2">Corporação Principal</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleDeptChange('PSP')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-sm font-bold transition-all duration-300 ${
                      department === 'PSP'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                        : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-blue-500 ${department === 'PSP' ? 'animate-ping' : ''}`} />
                    PSP (Polícia Pública)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeptChange('GNR')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-sm font-bold transition-all duration-300 ${
                      department === 'GNR'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                        : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-emerald-500 ${department === 'GNR' ? 'animate-ping' : ''}`} />
                    GNR (Guarda Nacional)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Apelido Policial</label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => {
                      playClick();
                      setOfficerName(e.target.value);
                    }}
                    placeholder="Ex: Silva / Pinto"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Indicativo de Agente</label>
                  <input
                    type="text"
                    value={officerID}
                    onChange={(e) => {
                      playClick();
                      setOfficerID(e.target.value);
                    }}
                    placeholder="Ex: PSP-2490"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Patente / Posto</label>
                <select
                  value={officerRank}
                  onChange={(e) => {
                    playClick();
                    setOfficerRank(e.target.value);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {currentRanks.map((rank) => (
                    <option key={rank} value={rank} className="bg-neutral-900 text-white">
                      {rank}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              {/* Sound preference */}
              <button
                type="button"
                onClick={toggleSound}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {soundOn ? (
                  <>
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                    <span>Efeitos Sonoros: Ativos</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-5 h-5 text-red-400" />
                    <span>Efeitos Sonoros: Mudos</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                className={`px-5 py-2 rounded-lg font-bold text-sm text-black transition-all duration-300 ${
                  department === 'PSP'
                    ? 'bg-blue-400 hover:bg-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                }`}
              >
                Salvar Alterações
              </button>
            </div>
          </form>

          {/* Quick tips about GTA Roleplay police rules */}
          <div className="bg-black/20 rounded-xl p-5 border border-white/5 space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Dica Roleplay Offset Portugal:</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              De acordo com as diretrizes do servidor, toda a viatura rebocada por infração ao código penal
              deve ser registada no sistema sob a matrícula com o prefixo <strong>VA-</strong> (Viatura Apreendida).
              O período mínimo de retenção é determinado pela gravidade da ocorrência. Certifique-se de depositar a viatura no
              lugar correto do parque de apreensões e anexar o ficheiro <code>.txt</code> de relatório ao canal policial oficial no Discord se solicitado pelo comando!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
