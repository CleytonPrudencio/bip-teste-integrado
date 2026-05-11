export interface Beneficio {
  id: number;
  nome: string;
  descricao: string | null;
  valor: number;
  ativo: boolean;
  version: number;
}

export interface BeneficioRequest {
  nome: string;
  descricao: string | null;
  valor: number;
  ativo: boolean;
}

export interface TransferRequest {
  fromId: number;
  toId: number;
  amount: number;
}

export interface TransferResponse {
  fromId: number;
  toId: number;
  amount: number;
  fromValorFinal: number;
  toValorFinal: number;
  executadoEm: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface TransferenciaHistorico {
  id: number;
  fromId: number;
  fromNome: string;
  toId: number;
  toNome: string;
  amount: number;
  fromValorFinal: number;
  toValorFinal: number;
  executadoEm: string;
}

export interface BeneficioStats {
  beneficioId: number;
  totalEnviado: number;
  totalRecebido: number;
  saldoLiquido: number;
  totalTransferencias: number;
}
