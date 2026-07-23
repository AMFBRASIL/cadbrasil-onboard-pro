-- Extensão Google Ads ValueTrack em tracking_sessoes
-- Template de URL final sugerido no Google Ads:
--   utm_source=google&utm_medium=cpc&utm_campaign=performance
--   &utm_id={campaignid}&utm_term={keyword}&utm_content={creative}
--   &utm_matchtype={matchtype}&utm_device={device}&utm_network={network}
--   &utm_adgroup={adgroupid}&utm_target={targetid}
--
-- Execute no MySQL antes (ou junto) do deploy do app.
-- Se alguma coluna já existir, ignore o erro dessa linha e continue.

ALTER TABLE tracking_sessoes
  ADD COLUMN utm_id VARCHAR(64) NULL COMMENT 'Google Ads campaign id ({campaignid})' AFTER utm_content;

ALTER TABLE tracking_sessoes
  ADD COLUMN utm_matchtype VARCHAR(16) NULL COMMENT 'e|p|b ({matchtype})' AFTER utm_id;

ALTER TABLE tracking_sessoes
  ADD COLUMN utm_device VARCHAR(16) NULL COMMENT 'm|t|c ({device})' AFTER utm_matchtype;

ALTER TABLE tracking_sessoes
  ADD COLUMN utm_network VARCHAR(16) NULL COMMENT 'g|s|d|y ({network})' AFTER utm_device;

ALTER TABLE tracking_sessoes
  ADD COLUMN utm_adgroup VARCHAR(64) NULL COMMENT 'ad group id ({adgroupid})' AFTER utm_network;

ALTER TABLE tracking_sessoes
  ADD COLUMN utm_target VARCHAR(64) NULL COMMENT 'target id ({targetid})' AFTER utm_adgroup;

-- Índices úteis para relatórios de campanha (opcional; ignore se já existirem)
CREATE INDEX idx_tracking_sessoes_utm_id ON tracking_sessoes (utm_id);
CREATE INDEX idx_tracking_sessoes_utm_adgroup ON tracking_sessoes (utm_adgroup);
