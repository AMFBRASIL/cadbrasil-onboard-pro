-- Tabela de solicitações de cancelamento (portal CADBRASIL)
-- Executar no MySQL do portal antes de usar /solicitacao-cancelamento em produção.

CREATE TABLE IF NOT EXISTS solicitacoes_cancelamento (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id BIGINT UNSIGNED NOT NULL,
  protocolo VARCHAR(32) NOT NULL,
  documento VARCHAR(32) NOT NULL,
  razao_social VARCHAR(160) NOT NULL,
  protocolo_cadastro VARCHAR(40) NULL,
  email VARCHAR(160) NULL,
  telefone VARCHAR(20) NULL,
  cidade VARCHAR(80) NULL,
  estado CHAR(2) NULL,
  motivos_json JSON NOT NULL,
  servico_esperado VARCHAR(80) NOT NULL,
  servico_esperado_outro VARCHAR(500) NULL,
  dados_reembolso_json JSON NOT NULL,
  deseja_monitoramento TINYINT(1) NOT NULL DEFAULT 0,
  reverter_cancelamento TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(60) NOT NULL DEFAULT 'Pendente',
  observacoes TEXT NULL,
  tracking_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_solicitacoes_cancelamento_protocolo (protocolo),
  KEY idx_solicitacoes_cancelamento_cliente (cliente_id),
  KEY idx_solicitacoes_cancelamento_documento (documento),
  KEY idx_solicitacoes_cancelamento_status (status),
  KEY idx_solicitacoes_cancelamento_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status possíveis:
--   Pendente
--   Pendente_com_interesse_monitoramento
--   Revertido_monitoramento  (cliente desistiu do cancelamento para manter acompanhamento)
--   Em_analise
--   Aprovado
--   Reembolso_pendente
--   Concluido
--   Recusado
