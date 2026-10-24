// Gera, a partir dos CSVs (fonte única da verdade):
//   web/data.js            dados para a landing page
//   web/simulador.js       cópia do motor para o navegador
//   web/n8n-assets.js      prompt e código do n8n para a página do guia
//   n8n/code-node.js       Code node pronto para colar no n8n (dados embutidos)
//   n8n/prompt-extracao.md prompt do Gemini com a lista de cargos válidos
// Uso: node scripts/build.js
const fs = require('fs');
const path = require('path');
const { loadData } = require('./load-data');

const raiz = path.join(__dirname, '..');
const data = loadData();
const fonte = fs.readFileSync(path.join(raiz, 'core', 'simulador.js'), 'utf8');

const ini = fonte.indexOf('// <<CORE-START>>');
const fim = fonte.indexOf('// <<CORE-END>>');
if (ini < 0 || fim < 0) throw new Error('Marcadores CORE-START/CORE-END não encontrados.');
const core = fonte.slice(ini + '// <<CORE-START>>'.length, fim).trim();

const dadosJs = 'const SQUAD_DATA = ' + JSON.stringify(data, null, 2) + ';\n';

// 1) Página web
fs.writeFileSync(path.join(raiz, 'web', 'data.js'), '// Gerado por scripts/build.js. Não edite à mão.\n' + dadosJs);
fs.writeFileSync(path.join(raiz, 'web', 'simulador.js'), '// Gerado por scripts/build.js. Não edite à mão.\n' + core + '\n');

// 2) Code node do n8n
const glue = `
// ---------- Entrada: JSON gerado pelo modelo (Gemini, Claude ou outro) no nó anterior ----------
const bruto = $input.first().json;
let texto = bruto.text
  || bruto.output
  || (bruto.content && bruto.content.parts && bruto.content.parts[0] && bruto.content.parts[0].text)
  || (Array.isArray(bruto.content) && bruto.content[0] && bruto.content[0].text)
  || (bruto.message && bruto.message.content)
  || '';
texto = String(texto).replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();

let pedido;
try {
  pedido = JSON.parse(texto);
} catch (e) {
  return [{ json: { output: 'Não entendi o pedido. Tente algo como: "2 Backend N3 e 1 Full Stack N3 de janeiro a junho".', erro: 'JSON inválido' } }];
}

const resultado = simular(SQUAD_DATA, pedido);
let output = formatarMarkdown(resultado);
if (resultado.ok && pedido.modelo) output = '**Modelo ' + pedido.modelo + '**\\n\\n' + output;
const fora = Array.isArray(pedido.fora_da_conta) ? pedido.fora_da_conta : [];
if (fora.length) {
  output += '\\n\\n_Fora da conta: ' + fora.join(', ') + '. Normalmente não são recursos do coordenador de TI._';
}
return [{ json: { output, resultado } }];
`;
const codeNode = '// Gerado por scripts/build.js. Cole inteiro no Code node (JavaScript, Run Once for All Items).\n' +
  dadosJs + '\n' + core + '\n' + glue;
fs.writeFileSync(path.join(raiz, 'n8n', 'code-node.js'), codeNode);

// 3) Prompt de extração com o catálogo atual
const lista = data.cargos.map(c => '- ' + c.cargo).join('\n');
const listaModelos = data.modelos.map(m =>
  '- Modelo ' + m.id + ' (' + m.nome + '): ' + m.squad.map(s => s.quantidade + 'x ' + s.cargo).join(', ')).join('\n');
const promptTexto = `Você extrai dados de pedidos de montagem de squad. Responda SOMENTE com JSON puro, sem texto antes ou depois e sem blocos de código.

Formato:
{
  "mes_inicio": "Janeiro",
  "mes_fim": "Junho",
  "modelo": null,
  "squad_request": [
    {"cargo": "Desenvolvedor Backend N3", "quantidade": 2}
  ],
  "fora_da_conta": []
}

Regras:
1. "cargo" deve ser exatamente um dos nomes do catálogo abaixo.
2. Se o usuário usar júnior, pleno ou sênior, converta para N1, N2 ou N3 do mesmo tipo de cargo.
3. Se não tiver certeza de qual cargo é, copie o texto original do usuário em "cargo". Nunca invente um cargo. O sistema vai pedir esclarecimento.
4. "quantidade" é um número inteiro. Se não for dito, use 1.
5. Meses em português, com a primeira letra maiúscula.
6. Se o período não for informado, use "mes_inicio": "Janeiro" e "mes_fim": "Dezembro".
7. Apelidos de cargo: "Tech Lead" é Líder Técnico (N4 se o nível não for dito); "Arquiteto" é Arquiteto Federado; "QA" ou "QA funcional" é Analista de Testes (N2 se o nível não for dito); "QA de automação" é Analista de Testes - Automação Funcional; "engenheiro de software" é Desenvolvedor Full Stack (N3 se o nível não for dito).
8. Se o usuário pedir um modelo pelo nome ("estrutura atual", "power squad", "super power squad", "modelo X", "modelo Y" ou "modelo Z"), preencha "modelo" com a letra e "squad_request" com a composição do modelo abaixo. Se ele mudar alguma quantidade, aplique a mudança. Sem modelo, deixe "modelo": null.
9. PM, IT Lead e coordenador não entram na conta. Não coloque esses papéis em "squad_request"; liste os que o usuário citar em "fora_da_conta".

Modelos de squad:
${listaModelos}

Catálogo de cargos:
${lista}`;

const promptMd = `# Prompt do nó Gemini (extração)

Cole no campo System Message. Na mensagem do usuário use: \`{{ $json.chatInput }}\`

\`\`\`
${promptTexto}
\`\`\`

Observação: a regra 2 (júnior, pleno, sênior igual a N1, N2, N3) é uma hipótese. Confirme com a empresa antes de usar com dados reais.
`;
fs.writeFileSync(path.join(raiz, 'n8n', 'prompt-extracao.md'), promptMd);

// 4) Textos para a página do guia (copiar com um clique)
fs.writeFileSync(
  path.join(raiz, 'web', 'n8n-assets.js'),
  '// Gerado por scripts/build.js. Não edite à mão.\n' +
  'const N8N_PROMPT = ' + JSON.stringify(promptTexto) + ';\n' +
  'const N8N_CODE = ' + JSON.stringify(codeNode) + ';\n'
);

// 5) Diagramas da arquitetura: os blocos mermaid do README viram dados da página de arquitetura
const readme = fs.readFileSync(path.join(raiz, 'README.md'), 'utf8');
const diagramas = readme.split(/^#{2,3} /m).slice(1)
  .map(secao => ({ titulo: secao.split('\n')[0].trim(), bloco: secao.match(/```mermaid\n([\s\S]*?)```/) }))
  .filter(s => s.bloco)
  .map(s => ({ titulo: s.titulo, codigo: s.bloco[1] }));
fs.writeFileSync(
  path.join(raiz, 'web', 'arquitetura-dados.js'),
  '// Gerado por scripts/build.js a partir do README.md. Não edite à mão.\n' +
  'const DIAGRAMAS = ' + JSON.stringify(diagramas, null, 2) + ';\n'
);

console.log('Build ok:', data.cargos.length, 'cargos,', data.consultorias.length, 'consultorias,', diagramas.length, 'diagramas.');
