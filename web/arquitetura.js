// Desenha os diagramas do README (arquitetura-dados.js) com Mermaid, no tema claro ou escuro do site.
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.esm.min.mjs";

const DESCRICOES = {
  "MVP 1: como está hoje": "Os CSVs alimentam o build, que gera os arquivos do site e do n8n. O simulador calcula no navegador; o chat passa pelo n8n.",
  "Caminho de uma pergunta no chat": "A IA só interpreta o texto e devolve um JSON. Todo número sai do código.",
  "Etapas dos MVPs": "Do MVP 1, pronto, até o custo-benefício. A ordem das etapas 3 a 5 ainda está em discussão no time.",
  "Arquitetura alvo": "Em tracejado, o que ainda não existe. Um agente decide o caminho de cada pergunta."
};

const alvo = document.getElementById("diagramas");
let rodada = 0;

async function desenhar() {
  const escuro = document.documentElement.getAttribute("data-theme") === "dark";
  mermaid.initialize({
    startOnLoad: false,
    theme: escuro ? "dark" : "default",
    fontFamily: getComputedStyle(document.body).fontFamily,
    flowchart: { htmlLabels: true, curve: "basis" }
  });
  rodada++;
  alvo.innerHTML = "";
  for (const [i, d] of DIAGRAMAS.entries()) {
    const secao = document.createElement("section");
    secao.className = "painel arq-diagrama";
    const h2 = document.createElement("h2");
    h2.textContent = d.titulo;
    secao.appendChild(h2);
    if (DESCRICOES[d.titulo]) {
      const p = document.createElement("p");
      p.textContent = DESCRICOES[d.titulo];
      secao.appendChild(p);
    }
    const caixa = document.createElement("div");
    caixa.className = "arq-svg";
    secao.appendChild(caixa);
    alvo.appendChild(secao);
    try {
      const { svg } = await mermaid.render("arq-" + rodada + "-" + i, d.codigo);
      caixa.innerHTML = svg;
    } catch (e) {
      caixa.textContent = "Não foi possível desenhar este diagrama.";
    }
  }
}

desenhar();
// redesenha quando o botão de tema muda o data-theme
new MutationObserver(desenhar).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
