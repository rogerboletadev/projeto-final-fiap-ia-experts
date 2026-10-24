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

  // Markdown simples da resposta do n8n: tabelas, negrito e itálico. Escapa o HTML antes.
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|\W)_(.+?)_(?=\W|$)/g, "$1<em>$2</em>");
  }
  function celulas(linha) {
    return linha.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  }
  function markdown(texto) {
    const linhas = texto.split(/\r?\n/);
    const out = [];
    let i = 0;
    while (i < linhas.length) {
      const l = linhas[i];
      if (/^\s*\|/.test(l) && /^\s*\|?\s*:?-{3,}/.test(linhas[i + 1] || "")) {
        const alinhar = celulas(linhas[i + 1]).map((c) => (/-:$/.test(c) ? ' class="num"' : ""));
        let t = "<div class=\"chat-tabela\"><table><thead><tr>" +
          celulas(l).map((c, k) => "<th" + (alinhar[k] || "") + ">" + inline(c) + "</th>").join("") + "</tr></thead><tbody>";
        i += 2;
        while (i < linhas.length && /^\s*\|/.test(linhas[i])) {
          t += "<tr>" + celulas(linhas[i]).map((c, k) => "<td" + (alinhar[k] || "") + ">" + inline(c) + "</td>").join("") + "</tr>";
          i++;
        }
        out.push(t + "</tbody></table></div>");
        continue;
      }
      if (l.trim()) out.push("<p>" + inline(l) + "</p>");
      i++;
    }
    return out.join("");
  }

  async function perguntar(texto) {
    texto = texto.trim();
    if (!texto) return;
    bolha(texto, "eu");
    msg.value = "";
    botao.disabled = true;
    const espera = bolha("Calculando…", "bot carregando");
    try {
      const resposta = await Conexao.enviar(texto);
      if (resposta) espera.innerHTML = markdown(resposta);
      else espera.textContent = "(resposta vazia: confira o campo de resposta na Configuração)";
      espera.classList.remove("carregando");
      espera.classList.add("formatada");
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
