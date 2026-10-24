// Configuração padrão da conexão com o n8n.
// Vale para todo mundo que abrir o site. Quem salvar outra URL na página
// config.html sobrescreve estes valores só no próprio navegador.
window.N8N_CONFIG_PADRAO = {
  webhookUrl: "",          // ex.: https://seu-n8n.app.n8n.cloud/webhook/squad-cost
  campoMensagem: "chatInput",
  campoResposta: "output",
  timeoutSeg: 60
};
