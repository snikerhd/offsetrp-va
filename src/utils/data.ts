export interface Citizen {
  cc: string;
  nome: string;
  dataNascimento: string;
  cartaConducao: boolean;
  pontosCarta: number;
  telefone: string;
  antecedentes: string[];
}

export interface SeizureReport {
  id: string; // e.g. SEI-9482
  matricula: string; // e.g. VA-12-AB
  proprietarioCC: string;
  motivo: string;
  multa: number;
  dataApreensao: string;
  dataLevantamento: string; // ISO String
  horaLevantamento: string; // e.g. "14:30"
  localApreensao: string;
  agenteResponsavel: string;
  agenteID: string;
  reboqueSolicitado: boolean;
  status: 'Apreendido' | 'Pronto para Levantamento' | 'Libertado' | 'Sob Investigação';
  lugarParque: string; // e.g. "A3"
  observacoes?: string;
  versao: number; // For file name suffix counter
}

export interface PenalArticle {
  id: string;
  titulo: string;
  multa: number;
  penaPrisao?: string; // e.g. "15 meses" (GTA V minutes or RP months)
  detalhes: string;
  categoria: 'Transito' | 'Crime' | 'Grave' | 'Apreensao';
}

export const MOCK_CITIZENS: Citizen[] = [
  {
    cc: "12345678",
    nome: "Ricardo 'Escobar' Santos",
    dataNascimento: "12/04/1995",
    cartaConducao: true,
    pontosCarta: 12,
    telefone: "912-345-678",
    antecedentes: ["Tráfico de estupefacientes (Leve)", "Falta de respeito à autoridade"]
  },
  {
    cc: "87654321",
    nome: "Tiago 'Sombra' Ferreira",
    dataNascimento: "04/11/1998",
    cartaConducao: false,
    pontosCarta: 0,
    telefone: "931-876-543",
    antecedentes: ["Fuga às autoridades", "Condução sem habilitação legal", "Assalto à mão armada"]
  },
  {
    cc: "11223344",
    nome: "Cláudia Filipa Neto",
    dataNascimento: "28/08/2000",
    cartaConducao: true,
    pontosCarta: 9,
    telefone: "967-112-233",
    antecedentes: ["Excesso de velocidade em zona urbana"]
  },
  {
    cc: "55667788",
    nome: "Gonçalo 'Padrinho' Costa",
    dataNascimento: "19/01/1990",
    cartaConducao: true,
    pontosCarta: 11,
    telefone: "925-566-778",
    antecedentes: ["Associação criminosa", "Detenção de arma de fogo ilegal"]
  },
  {
    cc: "99887766",
    nome: "Mariana Alvarenga",
    dataNascimento: "07/07/2001",
    cartaConducao: true,
    pontosCarta: 6,
    telefone: "910-998-877",
    antecedentes: ["Posse de substâncias ilícitas (Consumo)"]
  },
  {
    cc: "44332211",
    nome: "Diogo 'Hacker' Rodrigues",
    dataNascimento: "15/02/1997",
    cartaConducao: false,
    pontosCarta: 0,
    telefone: "934-443-322",
    antecedentes: ["Burla informática", "Fuga ao fisco em Los Santos"]
  },
  {
    cc: "22334455",
    nome: "Liliana 'Katana' Oliveira",
    dataNascimento: "30/05/1996",
    cartaConducao: true,
    pontosCarta: 12,
    telefone: "921-223-344",
    antecedentes: ["Agressão qualificada", "Perturbação da ordem pública"]
  }
];

export const MOTIVOS_APREENSAO = [
  {
    id: "1",
    titulo: "Veículo apreendido num assalto",
    multaBase: 15000,
    tempoHoras: 24,
    detalhes: "Artigo 142º do Código Penal de Los Santos - Viatura utilizada ativamente como meio de transporte ou fuga em assalto a estabelecimento comercial, residência ou banco."
  },
  {
    id: "2",
    titulo: "Veículo apreendido no decorrer de tentativa de fuga às autoridades",
    multaBase: 25000,
    tempoHoras: 48,
    detalhes: "Artigo 150º - Condução perigosa e desobediência civil qualificada. Tentativa de fuga activa a patrulhas terrestres ou aéreas da PSP/GNR."
  },
  {
    id: "3",
    titulo: "Veículo apreendido por falta de carta de condução",
    multaBase: 5000,
    tempoHoras: 12,
    detalhes: "Artigo 89º - Condução sem habilitação legal (falta de carta ou carta cassada por perda de pontos). Viatura retida até pagamento da coima."
  },
  {
    id: "4",
    titulo: "Veículo apreendido no decorrer de uma investigação",
    multaBase: 10000,
    tempoHoras: 72,
    detalhes: "Artigo 201º - Apreensão sob investigação policial da Polícia Judiciária ou brigada de trânsito. Suspeita de clonagem de matrícula, número de chassis adulterado ou transporte de substâncias."
  }
];

export const CODIGO_PENAL: PenalArticle[] = [
  { id: "CP-01", titulo: "Condução sob efeito de estupefacientes/álcool", multa: 3500, penaPrisao: "10 min", detalhes: "Detetado no teste de despistagem de álcool ou substâncias psicotrópicas em condução.", categoria: "Transito" },
  { id: "CP-02", titulo: "Excesso de Velocidade (Zona Urbana)", multa: 1500, penaPrisao: "Nenhuma", detalhes: "Circular a mais de 50km/h acima do limite estipulado em ambiente citadino.", categoria: "Transito" },
  { id: "CP-03", titulo: "Condução Sem Habilitação Legal", multa: 5000, penaPrisao: "15 min", detalhes: "Conduzir qualquer veículo motorizado sem possuir licença válida ou em período de cassação.", categoria: "Transito" },
  { id: "CP-04", titulo: "Uso de veículo em Assalto (Lojas/Caixas)", multa: 15000, penaPrisao: "30 min", detalhes: "Viatura associada a roubo de caixas multibanco, postos de abastecimento ou lojas comerciais.", categoria: "Crime" },
  { id: "CP-05", titulo: "Uso de veículo em Assalto à União Depósito", multa: 30000, penaPrisao: "60 min", detalhes: "Viatura identificada em assalto de grande escala ao banco central ou cofre forte.", categoria: "Crime" },
  { id: "CP-06", titulo: "Fuga Ativa às Autoridades (Perseguição)", multa: 25000, penaPrisao: "40 min", detalhes: "Recusar paragem obrigatória, promovendo uma perseguição policial de alto risco.", categoria: "Crime" },
  { id: "CP-07", titulo: "Viatura com Matrícula Falsa ou Clonada", multa: 12500, penaPrisao: "20 min", detalhes: "Adulteração física da chapa de matrícula ou inserção de dados falsificados no sistema.", categoria: "Grave" },
  { id: "CP-08", titulo: "Estacionamento Indevido em Zona Vermelha", multa: 1200, penaPrisao: "Nenhuma", detalhes: "Viatura estacionada a bloquear hidrantes, entradas de esquadra, hospitais ou faixas de bus.", categoria: "Transito" },
  { id: "CP-09", titulo: "Obstrução de Justiça", multa: 8000, penaPrisao: "25 min", detalhes: "Ocultação de viatura suspeita ou recusa de entrega de chaves de viatura apreendida por ordem judicial.", categoria: "Grave" }
];

export const LOCAIS_APREENSAO = [
  "Esquadra Principal PSP (Praça Legion)",
  "Quartel GNR (Sandy Shores)",
  "Posto de Trânsito (Paleto Bay)",
  "Garagem Central (Los Santos)",
  "Banco de Fleeca (Centro)",
  "Benny's Original Motorworks",
  "Autoestrada Del Perro (Km 12)",
  "Porto de Los Santos (Docks)",
  "Aeroporto Internacional de LS"
];

export const PARQUE_LUGARES = [
  "A1", "A2", "A3", "A4", "A5",
  "B1", "B2", "B3", "B4", "B5",
  "C1", "C2", "C3", "C4", "C5",
  "D1", "D2", "D3", "D4", "D5"
];

// Helper to get relative ISO date
export const getFutureDateString = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

export const getPastDateString = (hoursAgo: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

export const INITIAL_SEIZURES: SeizureReport[] = [
  {
    id: "SEI-4891",
    matricula: "VA-12-AB",
    proprietarioCC: "87654321",
    motivo: "Veículo apreendido no decorrer de tentativa de fuga às autoridades",
    multa: 25000,
    dataApreensao: getPastDateString(10),
    dataLevantamento: getFutureDateString(38), // Still has ~38h remaining
    horaLevantamento: "18:30",
    localApreensao: "Autoestrada Del Perro (Km 12)",
    agenteResponsavel: "Silva",
    agenteID: "PSP-2490",
    reboqueSolicitado: true,
    status: "Apreendido",
    lugarParque: "A1",
    observacoes: "Viatura circulava a mais de 220 km/h. Condutor tentou fugir a pé após colisão nas barreiras da autoestrada. Viatura recolhida de reboque.",
    versao: 1
  },
  {
    id: "SEI-5120",
    matricula: "VA-88-FF",
    proprietarioCC: "11223344",
    motivo: "Veículo apreendido por falta de carta de condução",
    multa: 5000,
    dataApreensao: getPastDateString(13),
    dataLevantamento: getFutureDateString(-1), // Finished 1 hour ago! Ready to release
    horaLevantamento: "11:00",
    localApreensao: "Garagem Central (Los Santos)",
    agenteResponsavel: "Pinto",
    agenteID: "GNR-5011",
    reboqueSolicitado: false,
    status: "Pronto para Levantamento",
    lugarParque: "B3",
    observacoes: "Fiscalização rotineira na garagem central. Sem carta de condução registada no IMT virtual.",
    versao: 1
  },
  {
    id: "SEI-3302",
    matricula: "VA-99-ZZ",
    proprietarioCC: "12345678",
    motivo: "Veículo apreendido num assalto",
    multa: 15000,
    dataApreensao: getPastDateString(26),
    dataLevantamento: getFutureDateString(-2), // Ready, release allowed
    horaLevantamento: "22:15",
    localApreensao: "Banco de Fleeca (Centro)",
    agenteResponsavel: "Carvalho",
    agenteID: "PSP-1004",
    reboqueSolicitado: true,
    status: "Pronto para Levantamento",
    lugarParque: "C2",
    observacoes: "Viatura de fuga localizada no exterior do Banco de Fleeca após roubo. Encontrado vestígios de explosivos e sacos de moedas no porta-bagagens.",
    versao: 1
  },
  {
    id: "SEI-7711",
    matricula: "VA-45-CG",
    proprietarioCC: "44332211",
    motivo: "Veículo apreendido no decorrer de uma investigação",
    multa: 10000,
    dataApreensao: getPastDateString(2),
    dataLevantamento: getFutureDateString(70), // 3 days total
    horaLevantamento: "15:45",
    localApreensao: "Benny's Original Motorworks",
    agenteResponsavel: "Mendes",
    agenteID: "PSP-3112",
    reboqueSolicitado: true,
    status: "Sob Investigação",
    lugarParque: "A5",
    observacoes: "Viatura com o número de chassis raspado. Suspeitas de clonagem de veículo importado ilegalmente de San Fierro. Sob tutela da Polícia Judiciária.",
    versao: 1
  },
  {
    id: "SEI-1209",
    matricula: "VA-50-PT",
    proprietarioCC: "55667788",
    motivo: "Veículo apreendido por falta de carta de condução",
    multa: 5000,
    dataApreensao: getPastDateString(40),
    dataLevantamento: getPastDateString(16),
    horaLevantamento: "09:00",
    localApreensao: "Esquadra Principal PSP (Praça Legion)",
    agenteResponsavel: "Silva",
    agenteID: "PSP-2490",
    reboqueSolicitado: false,
    status: "Libertado",
    lugarParque: "D4",
    observacoes: "Coima paga no valor de 5.000$ pelo proprietário. Viatura levantada por condutor habilitado. Registo encerrado.",
    versao: 2
  }
];

export const OFFICER_RANKS = {
  PSP: ["Agente", "Agente Principal", "Subchefe", "Chefe", "Subcomissário", "Comissário", "Intendente"],
  GNR: ["Guarda", "Guarda Principal", "Cabo", "Cabo-Chefe", "Alferes", "Tenente", "Capitão", "Major"]
};
