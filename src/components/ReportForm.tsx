import React, { useState, useEffect } from 'react';
import { FileText, Search, Database, DollarSign, Download, Clipboard, Check, Truck, Shield, FileOutput } from 'lucide-react';
import { MOCK_CITIZENS, MOTIVOS_APREENSAO, LOCAIS_APREENSAO, PARQUE_LUGARES, SeizureReport } from '../utils/data';
import { playClick, playSuccess, playWarning, playRadioChirp } from '../utils/audio';

interface ReportFormProps {
  department: 'PSP' | 'GNR';
  officerName: string;
  officerID: string;
  onAddSeizure: (newSeizure: SeizureReport) => void;
  existingSeizures: SeizureReport[];
  setActiveTab: (tab: string) => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  department,
  officerName,
  officerID,
  onAddSeizure,
  existingSeizures,
  setActiveTab
}) => {
  // Form States
  const [matriculaInput, setMatriculaInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [motivoOpcao, setMotivoOpcao] = useState('1'); // Default to motive 1
  const [customMotivo, setCustomMotivo] = useState('');
  const [multa, setMulta] = useState(15000); // Default for motive 1
  const [tempoRetencao, setTempoRetencao] = useState(24); // Default 24 hours
  const [localApreensao, setLocalApreensao] = useState(LOCAIS_APREENSAO[0]);
  const [reboqueSolicitado, setReboqueSolicitado] = useState(true);
  const [lugarParque, setLugarParque] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Helper States
  const [citizenLookupStatus, setCitizenLookupStatus] = useState<'idle' | 'found' | 'not-found'>('idle');
  const [generatedReportText, setGeneratedReportText] = useState('');
  const [generatedFileName, setGeneratedFileName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-fill parking spot
  useEffect(() => {
    // Find first available parking spot not occupied by "Apreendido", "Pronto para Levantamento", "Sob Investigação"
    const occupiedSpots = existingSeizures
      .filter(s => s.status !== 'Libertado')
      .map(s => s.lugarParque);
    const availableSpot = PARQUE_LUGARES.find(spot => !occupiedSpots.includes(spot));
    if (availableSpot) {
      setLugarParque(availableSpot);
    } else {
      setLugarParque('A1'); // fallback
    }
  }, [existingSeizures]);

  // Adjust fine and retention time when motive changes
  useEffect(() => {
    if (motivoOpcao !== 'custom') {
      const selected = MOTIVOS_APREENSAO.find(m => m.id === motivoOpcao);
      if (selected) {
        setMulta(selected.multaBase);
        setTempoRetencao(selected.tempoHoras);
      }
    } else {
      setMulta(2000);
      setTempoRetencao(24);
    }
  }, [motivoOpcao]);

  // Citizen DB lookup simulator
  const handleLookupCitizen = () => {
    playClick();
    if (!ccInput.trim()) {
      playWarning();
      return;
    }
    const citizen = MOCK_CITIZENS.find(c => c.cc === ccInput.trim());
    if (citizen) {
      playSuccess();
      setCitizenLookupStatus('found');
      
      // Auto-fill observations if they don't have a license
      if (!citizen.cartaConducao && motivoOpcao === '3') {
        setObservacoes(prev => prev || `Condutor sem licença de condução.`);
      }
    } else {
      playWarning();
      setCitizenLookupStatus('not-found');
    }
  };

  // Generate unique file name (replicates the Python "obter_nome_ficheiro" logic!)
  const getUniqueFileName = (matricula: string) => {
    const nomeBase = `Relatorio_${matricula}`;
    
    // Check how many files we have for this plate in our database
    const matches = existingSeizures.filter(s => s.matricula === matricula);
    
    // If none exist, the first file name in Python would be `Relatorio_{matricula}.txt`. 
    // If it already exists, it iterates _1, _2 etc.
    if (matches.length === 0) {
      return `${nomeBase}.txt`;
    } else {
      // Find a safe suffix
      let suffix = 1;
      
      // Since our existingSeizures tracks reports, we'll just check if any existing has this exact version
      while (existingSeizures.some(s => s.matricula === matricula && s.versao === suffix)) {
        suffix++;
      }
      return { filename: `${nomeBase}_${suffix}.txt`, suffix };
    }
  };

  // Submit report
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();

    if (!matriculaInput.trim()) {
      playWarning();
      alert('Matrícula inválida. Operação cancelada.');
      return;
    }

    const formattedMatricula = `VA-${matriculaInput.toUpperCase().trim()}`;
    const formattedCC = ccInput.trim() || "Desconhecido";
    
    // Get Motive text
    let selectedMotiveText = "";
    if (motivoOpcao === 'custom') {
      selectedMotiveText = customMotivo.trim() || "Viatura apreendida por infração grave";
    } else {
      const selected = MOTIVOS_APREENSAO.find(m => m.id === motivoOpcao);
      selectedMotiveText = selected ? selected.titulo : "Viatura apreendida";
    }

    // Date calculations (tomorrow at same time, matching Python + timedelta(days=1))
    const now = new Date();
    const releaseDate = new Date();
    releaseDate.setHours(now.getHours() + tempoRetencao);

    // Format dates as DD/MM/YYYY and HH:MM
    const dataLevantamentoStr = releaseDate.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaLevantamentoStr = releaseDate.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Exact report content format matching the Python template!
    const relatorioText = (
      `\n${formattedMatricula}\n` +
      `Viatura Apreendida\n\n` +
      `Número de CC: ${formattedCC}\n` +
      `Motivo da Apreensão: ${selectedMotiveText}\n\n` +
      `Nota: Levantar dia ${dataLevantamentoStr} às ${horaLevantamentoStr}\n`
    );

    // File name logic
    const fileResult = getUniqueFileName(formattedMatricula);
    const finalFileName = typeof fileResult === 'string' ? fileResult : fileResult.filename;
    const finalSuffix = typeof fileResult === 'string' ? 1 : fileResult.suffix;

    setGeneratedReportText(relatorioText);
    setGeneratedFileName(finalFileName);

    // Create report model for state
    const newSeizure: SeizureReport = {
      id: `SEI-${Math.floor(1000 + Math.random() * 9000)}`,
      matricula: formattedMatricula,
      proprietarioCC: formattedCC,
      motivo: selectedMotiveText,
      multa: multa,
      dataApreensao: now.toISOString(),
      dataLevantamento: releaseDate.toISOString(),
      horaLevantamento: horaLevantamentoStr,
      localApreensao: localApreensao,
      agenteResponsavel: officerName || "Silva",
      agenteID: officerID || "PSP-2490",
      reboqueSolicitado: reboqueSolicitado,
      status: motivoOpcao === '4' ? 'Sob Investigação' : 'Apreendido',
      lugarParque: lugarParque,
      observacoes: observacoes.trim(),
      versao: finalSuffix
    };

    // Add to parent list
    onAddSeizure(newSeizure);
    setIsSuccess(true);
    playRadioChirp();

    // Scroll to report display
    setTimeout(() => {
      document.getElementById('generated-report-block')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Trigger browser file download of the text report (replicates Python saving to disk!)
  const handleDownloadFile = () => {
    playSuccess();
    const element = document.createElement("a");
    const file = new Blob([generatedReportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = generatedFileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(generatedReportText);
    playSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForm = () => {
    playClick();
    setMatriculaInput('');
    setCcInput('');
    setMotivoOpcao('1');
    setCustomMotivo('');
    setObservacoes('');
    setIsSuccess(false);
    setGeneratedReportText('');
    setCitizenLookupStatus('idle');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-white flex items-center gap-2">
            <FileText className={`w-7 h-7 ${department === 'PSP' ? 'text-blue-400' : 'text-emerald-400'}`} />
            REGISTO DE APREENSÃO
          </h2>
          <p className="text-sm text-gray-400 font-sans">
            Gere os relatórios de veículos rebocados e guarde os ficheiros <code>.txt</code> oficiais
          </p>
        </div>
        <span className="font-mono text-xs text-gray-500 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
          POLICE TERMINAL v2.6
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form Column */}
        <form onSubmit={handleGenerateReport} className="lg:col-span-3 space-y-5 bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/5">
          <h3 className="text-base font-bold tracking-wide text-white uppercase border-b border-white/5 pb-2">
            Dados da Apreensão
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plate Input (Autoprefixes VA-) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1 flex items-center gap-1">
                Matrícula <span className="text-red-400 font-bold">*</span>
              </label>
              <div className="relative flex rounded-lg overflow-hidden border border-white/10 focus-within:border-blue-500">
                <span className="bg-neutral-800 text-neutral-400 px-3 py-2 text-sm font-bold font-mono border-r border-white/10 flex items-center">
                  VA-
                </span>
                <input
                  type="text"
                  placeholder="12-AB ou 99-ZZ"
                  value={matriculaInput}
                  onChange={(e) => {
                    playClick();
                    setMatriculaInput(e.target.value.toUpperCase());
                  }}
                  className="w-full bg-black/40 px-3 py-2 text-sm text-white focus:outline-none font-mono uppercase"
                  required
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Preencha sem o prefixo, o terminal insere "VA-" automaticamente</p>
            </div>

            {/* CC Input with Database Lookup */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1 flex items-center gap-1">
                Nº Cartão Cidadão (CC) <span className="text-red-400 font-bold">*</span>
              </label>
              <div className="relative flex rounded-lg border border-white/10 focus-within:border-blue-500">
                <input
                  type="text"
                  placeholder="87654321"
                  value={ccInput}
                  onChange={(e) => {
                    playClick();
                    setCcInput(e.target.value.replace(/[^0-9]/g, ''));
                  }}
                  className="w-full bg-black/40 px-3 py-2 text-sm text-white focus:outline-none font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={handleLookupCitizen}
                  className={`px-3 bg-neutral-800 border-l border-white/10 text-gray-300 hover:bg-neutral-700 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold`}
                  title="Verificar na Base de Dados Policial"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Validar</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Insira o CC e clique em "Validar" para preencher dados</p>
            </div>
          </div>

          {/* Owner Info from DB Lookup */}
          {citizenLookupStatus !== 'idle' && (
            <div className={`p-3.5 rounded-lg border flex gap-3 items-center transition-all duration-300 ${
              citizenLookupStatus === 'found'
                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300/90'
                : 'bg-red-950/20 border-red-500/20 text-red-300/90'
            }`}>
              <Database className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs space-y-0.5">
                {citizenLookupStatus === 'found' ? (
                  <>
                    <p className="font-bold">Cidadão Registado no Servidor</p>
                    <p className="opacity-80">
                      Carta de Condução: {MOCK_CITIZENS.find(c => c.cc === ccInput)?.cartaConducao ? (
                        <span className="text-emerald-400 font-bold">ATIVA ({MOCK_CITIZENS.find(c => c.cc === ccInput)?.pontosCarta} Pontos)</span>
                      ) : (
                        <span className="text-red-400 font-bold">NÃO DETETADA / CASSADA (0 Pontos)</span>
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">CC não encontrado no Sistema Virtual</p>
                    <p className="opacity-80">Verifique os números inseridos ou prossiga com o auto.</p>
                  </>
                )}
              </div>
            </div>
          )}

          <h3 className="text-base font-bold tracking-wide text-white uppercase border-b border-white/5 pb-2 pt-2">
            Motivo Policial & Coima
          </h3>

          {/* Motive Selector (Replicates 1-4 Python choices + Custom) */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-300 uppercase">Motivo Legal da Apreensão</label>
            <div className="grid grid-cols-1 gap-2.5">
              {MOTIVOS_APREENSAO.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                    motivoOpcao === m.id
                      ? department === 'PSP'
                        ? 'bg-blue-600/10 border-blue-500 text-blue-100'
                        : 'bg-emerald-600/10 border-emerald-500 text-emerald-100'
                      : 'bg-black/20 border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10'
                  }`}
                  onClick={() => {
                    playClick();
                    setMotivoOpcao(m.id);
                  }}
                >
                  <input
                    type="radio"
                    name="motivo"
                    checked={motivoOpcao === m.id}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 accent-blue-500"
                  />
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold uppercase bg-black/40 px-2 py-0.5 rounded text-gray-300 font-mono mr-2">
                      Opção {m.id}
                    </span>
                    <span className="text-xs font-bold">{m.titulo}</span>
                    <p className="text-[10px] text-gray-400 font-sans mt-0.5 line-clamp-1">{m.detalhes}</p>
                  </div>
                </label>
              ))}

              {/* Custom motive choice */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                  motivoOpcao === 'custom'
                    ? department === 'PSP'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-100'
                      : 'bg-emerald-600/10 border-emerald-500 text-emerald-100'
                    : 'bg-black/20 border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10'
                }`}
                onClick={() => {
                  playClick();
                  setMotivoOpcao('custom');
                }}
              >
                <input
                  type="radio"
                  name="motivo"
                  checked={motivoOpcao === 'custom'}
                  onChange={() => {}}
                  className="mt-1 h-4 w-4 accent-blue-500"
                />
                <div className="space-y-1 w-full">
                  <span className="text-xs font-extrabold uppercase bg-black/40 px-2 py-0.5 rounded text-gray-300 font-mono mr-2">
                    Outro
                  </span>
                  <span className="text-xs font-bold">Outro Motivo Personalizado</span>
                  {motivoOpcao === 'custom' && (
                    <input
                      type="text"
                      placeholder="Introduza o motivo customizado aqui..."
                      value={customMotivo}
                      onChange={(e) => {
                        playClick();
                        setCustomMotivo(e.target.value);
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors mt-2"
                      required={motivoOpcao === 'custom'}
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fine Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1 flex items-center gap-1">
                Valor da Coima (€)
              </label>
              <div className="relative rounded-lg border border-white/10 focus-within:border-blue-500">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={multa}
                  onChange={(e) => {
                    playClick();
                    setMulta(Math.max(0, parseInt(e.target.value) || 0));
                  }}
                  className="w-full bg-black/40 pl-10 pr-4 py-2 text-sm text-white focus:outline-none font-mono"
                  min="0"
                />
              </div>
            </div>

            {/* Retention duration / Release computation */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Período de Retenção</label>
              <select
                value={tempoRetencao}
                onChange={(e) => {
                  playClick();
                  setTempoRetencao(parseInt(e.target.value));
                }}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value={12} className="bg-neutral-900 text-white">12 Horas (Falta de Carta)</option>
                <option value={24} className="bg-neutral-900 text-white">24 Horas (Assalto / Geral)</option>
                <option value={48} className="bg-neutral-900 text-white">48 Horas (Fuga às Autoridades)</option>
                <option value={72} className="bg-neutral-900 text-white">72 Horas (Investigação Ativa)</option>
                <option value={168} className="bg-neutral-900 text-white">7 Dias (Retenção Prolongada)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Seizure Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Local da Apreensão</label>
              <select
                value={localApreensao}
                onChange={(e) => {
                  playClick();
                  setLocalApreensao(e.target.value);
                }}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {LOCAIS_APREENSAO.map(l => (
                  <option key={l} value={l} className="bg-neutral-900 text-white">{l}</option>
                ))}
              </select>
            </div>

            {/* Parking Spot selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Lugar de Estacionamento</label>
              <select
                value={lugarParque}
                onChange={(e) => {
                  playClick();
                  setLugarParque(e.target.value);
                }}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {PARQUE_LUGARES.map(spot => {
                  const isOccupied = existingSeizures.some(s => s.lugarParque === spot && s.status !== 'Libertado');
                  return (
                    <option key={spot} value={spot} className="bg-neutral-900 text-white">
                      Lugar {spot} {isOccupied ? '⚠️ (Ocupado)' : '✅ (Livre)'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Tow requested checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="reboque"
              checked={reboqueSolicitado}
              onChange={(e) => {
                playClick();
                setReboqueSolicitado(e.target.checked);
              }}
              className="h-4 w-4 rounded accent-blue-500 cursor-pointer"
            />
            <label htmlFor="reboque" className="text-xs text-gray-300 select-none cursor-pointer flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-gray-400" />
              Solicitar Reboque da PSP / GNR para recolha da viatura ao parque municipal
            </label>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Notas Policiais / Observações de Ocorrência</label>
            <textarea
              placeholder="Ex: Condutor resistiu à detenção, viatura colidiu com postes de iluminação e necessitou de reboque. Encontrados vestígios suspeitos no banco traseiro..."
              value={observacoes}
              onChange={(e) => {
                playClick();
                setObservacoes(e.target.value);
              }}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-sans"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            {isSuccess && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 border border-white/10 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                Limpar Formulário
              </button>
            )}

            <button
              type="submit"
              className={`px-5 py-2.5 rounded-lg text-sm font-extrabold text-black uppercase tracking-wider transition-all duration-300 ${
                department === 'PSP'
                  ? 'bg-blue-400 hover:bg-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              Gerar Relatório de Viatura
            </button>
          </div>
        </form>

        {/* Generated File Output Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-neutral-950/80 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-500" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-yellow-500">
                    Módulo de Ficheiros do Portal Policial
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
              </div>

              {generatedReportText ? (
                <div className="space-y-4" id="generated-report-block">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-400">
                      Ficheiro Gerado: <strong className="text-white">{generatedFileName}</strong>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-bold animate-pulse">
                      Gravado!
                    </span>
                  </div>

                  {/* Real visual file terminal block */}
                  <div className="bg-black/90 p-4 rounded-lg border border-white/10 font-mono text-xs text-yellow-400 leading-relaxed shadow-inner overflow-x-auto select-all relative">
                    <div className="absolute right-3 top-3 text-[10px] font-bold uppercase text-neutral-600 border border-neutral-800 rounded px-1.5 select-none">
                      ASCII Block
                    </div>
                    <pre className="whitespace-pre-wrap">{generatedReportText}</pre>
                  </div>

                  <p className="text-[11px] text-gray-400 font-sans">
                    Como o script de Python original fazia, criamos um ficheiro <code>.txt</code> único. Descarregue para a sua pasta ou copie para anexar no canal oficial de discord do servidor.
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center space-y-3 flex flex-col items-center justify-center">
                  <FileOutput className="w-12 h-12 text-neutral-600 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-400">A aguardar dados...</h4>
                    <p className="text-xs text-gray-500 max-w-xs mt-1 leading-relaxed">
                      Preencha o formulário policial à esquerda e clique em <strong>"Gerar Relatório de Viatura"</strong> para redigir o auto oficial de retenção.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {generatedReportText && (
              <>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 mt-6">
                  <button
                    type="button"
                    onClick={handleCopyClipboard}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-white/10 bg-neutral-900 text-xs font-bold text-white hover:bg-neutral-800 hover:border-white/20 transition-all duration-200"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-4 h-4 text-gray-400" />
                        <span>Copiar Relatório</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-bold text-black transition-all duration-200 ${
                      department === 'PSP' ? 'bg-blue-400 hover:bg-blue-300' : 'bg-emerald-400 hover:bg-emerald-300'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Descarregar .txt</span>
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setActiveTab('list');
                  }}
                  className="w-full mt-3 flex items-center justify-center gap-2 p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all duration-200"
                >
                  Ver no Parque de Apreensões →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
