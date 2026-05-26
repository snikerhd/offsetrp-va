import React, { useState } from 'react';
import { Search, ShieldAlert, Scale, Clipboard, Check, DollarSign, Clock } from 'lucide-react';
import { CODIGO_PENAL, MOTIVOS_APREENSAO } from '../utils/data';
import { playClick, playSuccess } from '../utils/audio';

interface PenalCodeProps {
  department: 'PSP' | 'GNR';
}

export const PenalCode: React.FC<PenalCodeProps> = ({ department }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'tudo' | 'transito' | 'crime' | 'grave' | 'apreensao'>('tudo');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    playSuccess();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFilteredArticles = () => {
    let list = [...CODIGO_PENAL];
    
    // Add vehicle seizure reasons as special articles
    const seizureArticles = MOTIVOS_APREENSAO.map((m, index) => ({
      id: `AP-${index + 1}`,
      titulo: m.titulo,
      multa: m.multaBase,
      penaPrisao: `${m.tempoHoras}h retenção`,
      detalhes: m.detalhes,
      categoria: 'Apreensao' as const
    }));

    const combined = [...list, ...seizureArticles];

    return combined.filter(article => {
      const matchesSearch = 
        article.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.detalhes.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (activeTab === 'tudo') return true;
      if (activeTab === 'transito' && article.categoria === 'Transito') return true;
      if (activeTab === 'crime' && article.categoria === 'Crime') return true;
      if (activeTab === 'grave' && article.categoria === 'Grave') return true;
      if (activeTab === 'apreensao' && article.categoria === 'Apreensao') return true;
      return false;
    });
  };

  const filtered = getFilteredArticles();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wider text-white flex items-center gap-2">
            <Scale className={`w-7 h-7 ${department === 'PSP' ? 'text-blue-400' : 'text-emerald-400'}`} />
            CÓDIGO PENAL & DIRETRIZES
          </h2>
          <p className="text-sm text-gray-400">Consulta rápida de coimas, penas de prisão e motivos oficiais de apreensão</p>
        </div>
      </div>

      {/* Control Bar: Search and Category Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por artigo, multa ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => {
              playClick();
              setSearchTerm(e.target.value);
            }}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 md:col-span-2 md:justify-end">
          {(['tudo', 'transito', 'crime', 'grave', 'apreensao'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                playClick();
                setActiveTab(tab);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                activeTab === tab
                  ? department === 'PSP'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                    : 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'
              }`}
            >
              {tab === 'tudo' ? 'Todos' : tab === 'transito' ? 'Trânsito' : tab === 'crime' ? 'Crimes' : tab === 'grave' ? 'Graves' : 'Apreensões'}
            </button>
          ))}
        </div>
      </div>

      {/* List layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map((art) => (
            <div
              key={art.id}
              className={`group bg-black/30 backdrop-blur-md border rounded-xl p-5 hover:bg-black/40 transition-all duration-300 relative flex flex-col justify-between ${
                art.categoria === 'Apreensao'
                  ? 'border-yellow-500/20 hover:border-yellow-500/40'
                  : art.categoria === 'Grave'
                  ? 'border-red-500/20 hover:border-red-500/40'
                  : department === 'PSP'
                  ? 'border-blue-500/10 hover:border-blue-500/30'
                  : 'border-emerald-500/10 hover:border-emerald-500/30'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
                      art.categoria === 'Apreensao'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : art.categoria === 'Grave'
                        ? 'bg-red-500/20 text-red-300'
                        : art.categoria === 'Crime'
                        ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {art.id}
                    </span>
                    <span className="text-xs text-gray-500 uppercase font-bold">
                      {art.categoria === 'Transito' ? 'Infração de Estrada' : art.categoria === 'Crime' ? 'Crime Ativo' : art.categoria === 'Grave' ? 'Crime de Alto Risco' : 'Apreensão de Veículo'}
                    </span>
                  </div>
                  
                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyText(`[Código Penal - ${art.id}] ${art.titulo} - Coima: ${art.multa.toLocaleString()}€ | Pena: ${art.penaPrisao || 'Nenhuma'}`, art.id)}
                    className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                    title="Copiar artigo policial"
                  >
                    {copiedId === art.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clipboard className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-blue-200 transition-colors">
                  {art.titulo}
                </h3>

                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  {art.detalhes}
                </p>
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-1 bg-yellow-500/5 text-yellow-400/90 font-bold px-2 py-1 rounded">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Multa: {art.multa.toLocaleString()} €</span>
                </div>

                {art.penaPrisao && art.penaPrisao !== 'Nenhuma' && (
                  <div className="flex items-center gap-1 bg-red-500/5 text-red-400 font-bold px-2 py-1 rounded">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pena: {art.penaPrisao}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-black/20 rounded-xl p-8 text-center border border-dashed border-white/10">
            <ShieldAlert className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-400">Nenhum artigo encontrado</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">Nenhum artigo ou infração corresponde à sua pesquisa. Tente usar outros termos ou selecione outra categoria.</p>
          </div>
        )}
      </div>

      {/* Protocol warning */}
      <div className={`p-4 rounded-xl border flex gap-3 items-start ${
        department === 'PSP' ? 'bg-blue-950/20 border-blue-500/30 text-blue-300' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
      }`}>
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wide">AVISO DO COMANDO - PROTOCOLO DE REBOQUE E APREENSÃO:</h4>
          <p className="text-xs leading-relaxed opacity-80">
            Qualquer viatura apreendida que seja libertada sem o registo correspondente e validação do pagamento da coima no terminal, constitui infração grave ao regulamento de serviço (RDM/PSP ou RDM/GNR). Em caso de fuga às autoridades, o tempo de apreensão de 48 horas é obrigatório e não pode ser reduzido sem ordem direta de um oficial de patente superior (Comissário / Major ou superior).
          </p>
        </div>
      </div>
    </div>
  );
};
