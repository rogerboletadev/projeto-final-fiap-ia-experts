// Lê e grava a configuração do n8n e faz a chamada ao webhook.
(function () {
  const CHAVE = "squad-cost-n8n";

  function ler() {
    let salvo = {};
    try { salvo = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) {}
    return Object.assign({}, window.N8N_CONFIG_PADRAO, salvo);
  }

  function salvar(cfg) {
    try { localStorage.setItem(CHAVE, JSON.stringify(cfg)); return true; } catch (e) { return false; }
  }

  function limpar() {
    try { localStorage.removeItem(CHAVE); } catch (e) {}
  }

  function sessao() {
    let id;
    try { id = sessionStorage.getItem(CHAVE + "-sessao"); } catch (e) {}
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2);
      try { sessionStorage.setItem(CHAVE + "-sessao", id); } catch (e) {}
    }
    return id;
  }

  // Procura o texto da resposta: no campo configurado, em campos comuns ou no texto puro.
  function extrairTexto(dados, campo) {
    if (Array.isArray(dados)) dados = dados[0];
    if (dados == null) return "";
    if (typeof dados === "string") return dados;
    for (const c of [campo, "output", "text", "message", "response"]) {
      if (c && dados[c] != null) return typeof dados[c] === "string" ? dados[c] : JSON.stringify(dados[c], null, 2);
    }
    return JSON.stringify(dados, null, 2);
  }

  async function enviar(mensagem, cfg) {
    cfg = cfg || ler();
    if (!cfg.webhookUrl) throw new Error("A URL do webhook ainda não foi configurada.");

    const corpo = { action: "sendMessage", sessionId: sessao() };
    corpo[cfg.campoMensagem || "chatInput"] = mensagem;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), (Number(cfg.timeoutSeg) || 60) * 1000);
    let resp;
    try {
      resp = await fetch(cfg.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        signal: ctrl.signal
      });
    } catch (e) {
      if (e.name === "AbortError") throw new Error("O n8n demorou demais para responder.");
      throw new Error("Não foi possível falar com o n8n. Confira a URL, se o workflow está ativo e o CORS (Allowed Origins).");
    } finally {
      clearTimeout(timer);
    }

    const bruto = await resp.text();
    if (!resp.ok) throw new Error("O n8n respondeu com erro " + resp.status + ". " + bruto.slice(0, 200));
    let dados = bruto;
    try { dados = JSON.parse(bruto); } catch (e) {}
    return extrairTexto(dados, cfg.campoResposta);
  }

  window.Conexao = { ler, salvar, limpar, enviar };
})();
