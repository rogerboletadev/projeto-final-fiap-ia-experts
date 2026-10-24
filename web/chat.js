(function () {
  const log = document.getElementById("log");
  const form = document.getElementById("form");
  const msg = document.getElementById("msg");
  const botao = document.getElementById("enviar");

  if (!Conexao.ler().webhookUrl) document.getElementById("aviso-config").hidden = false;

  function bolha(texto, tipo) {
    const el = document.createElement("div");
    el.className = "bolha " + tipo;
    el.textContent = texto;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  async function perguntar(texto) {
    texto = texto.trim();
    if (!texto) return;
    bolha(texto, "eu");
    msg.value = "";
    botao.disabled = true;
    const espera = bolha("Calculando…", "bot carregando");
    try {
      espera.textContent = await Conexao.enviar(texto) || "(resposta vazia: confira o campo de resposta na Configuração)";
      espera.classList.remove("carregando");
    } catch (e) {
      espera.textContent = e.message;
      espera.className = "bolha erro";
    } finally {
      botao.disabled = false;
      msg.focus();
    }
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); perguntar(msg.value); });
  msg.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); perguntar(msg.value); }
  });
  document.querySelectorAll("[data-texto]").forEach((b) =>
    b.addEventListener("click", () => perguntar(b.dataset.texto)));
})();
