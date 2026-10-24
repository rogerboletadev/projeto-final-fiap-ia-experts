// Rodar com: node core/simulador.test.js
const assert = require('assert');
const { loadData } = require('../scripts/load-data');
const { simular, formatarMarkdown, acharMes } = require('./simulador');

const data = loadData();
let ok = 0;
function teste(nome, fn) {
  try { fn(); ok++; console.log('ok   ' + nome); }
  catch (e) { console.error('FALHOU ' + nome + '\n  ' + e.message); process.exitCode = 1; }
}
const perto = (a, b) => Math.abs(a - b) < 0.005;

const pedidoBase = {
  mes_inicio: 'Janeiro',
  mes_fim: 'Junho',
  squad_request: [
    { cargo: 'Desenvolvedor Backend N3', quantidade: 2 },
    { cargo: 'Desenvolvedor Full Stack N3', quantidade: 1 }
  ]
};

teste('Jan a Jun tem 974 horas úteis', () => {
  const r = simular(data, pedidoBase);
  assert.ok(r.ok);
  assert.strictEqual(r.periodo.horas, 974);
});

teste('Consultoria A: 2 Backend N3 + 1 Full Stack N3 = 633.100,00', () => {
  const r = simular(data, pedidoBase);
  const a = r.resultados.find(x => x.consultoria === 'Consultoria A');
  assert.ok(perto(a.total, 633100), 'total A = ' + a.total);
});

teste('Consultoria B = 713.693,63 (conferido à mão)', () => {
  const r = simular(data, pedidoBase);
  const b = r.resultados.find(x => x.consultoria === 'Consultoria B');
  assert.ok(perto(b.total, 713693.63), 'total B = ' + b.total);
});

teste('A é a mais barata e a diferença dela é zero', () => {
  const r = simular(data, pedidoBase);
  assert.strictEqual(r.mais_barata, 'Consultoria A');
  assert.strictEqual(r.resultados[0].diferenca, 0);
});

teste('Sem período, assume o ano todo (1998 horas)', () => {
  const r = simular(data, { squad_request: [{ cargo: 'Líder Técnico N4', quantidade: 1 }] });
  assert.ok(r.ok);
  assert.strictEqual(r.periodo.horas, 1998);
  assert.strictEqual(r.periodo.inicio, 'Janeiro');
  assert.strictEqual(r.periodo.fim, 'Dezembro');
});

teste('Aceita mês abreviado e sem acento', () => {
  assert.strictEqual(acharMes('jan'), 0);
  assert.strictEqual(acharMes('MARCO'), 2);
  assert.strictEqual(acharMes('março'), 2);
  assert.strictEqual(acharMes('xyz'), -1);
});

teste('Cargo fora do catálogo gera erro com sugestões, não custo parcial', () => {
  const r = simular(data, { squad_request: [{ cargo: 'dev sr backend', quantidade: 1 }] });
  assert.strictEqual(r.ok, false);
  assert.ok(r.erros[0].includes('fora do catálogo'));
  assert.ok(r.erros[0].includes('Desenvolvedor Backend'));
});

teste('Mês final antes do inicial gera erro', () => {
  const r = simular(data, { mes_inicio: 'Junho', mes_fim: 'Março', squad_request: pedidoBase.squad_request });
  assert.strictEqual(r.ok, false);
});

teste('Quantidade inválida gera erro', () => {
  const r = simular(data, { squad_request: [{ cargo: 'Líder Técnico N4', quantidade: 0 }] });
  assert.strictEqual(r.ok, false);
});

teste('Cargos repetidos são somados', () => {
  const r = simular(data, {
    mes_inicio: 'Janeiro', mes_fim: 'Janeiro',
    squad_request: [
      { cargo: 'Analista de Testes N1', quantidade: 1 },
      { cargo: 'analista de testes n1', quantidade: 2 }
    ]
  });
  assert.strictEqual(r.squad.length, 1);
  assert.strictEqual(r.squad[0].quantidade, 3);
});

teste('Valor/hora vem de base x fator (corrige o Backend N1 da B)', () => {
  const r = simular(data, { mes_inicio: 'Janeiro', mes_fim: 'Janeiro', squad_request: [{ cargo: 'Desenvolvedor Backend N1', quantidade: 1 }] });
  const b = r.resultados.find(x => x.consultoria === 'Consultoria B');
  assert.ok(perto(b.itens[0].valor_hora, 112.73));
});

teste('Markdown traz as tabelas e o resultado', () => {
  const md = formatarMarkdown(simular(data, pedidoBase));
  assert.ok(md.includes('| Consultoria A |'));
  assert.ok(md.includes('974 horas úteis'));
  assert.ok(md.includes('Menor custo no período: **Consultoria A**'));
});

teste('Markdown de erro pede reformulação', () => {
  const md = formatarMarkdown(simular(data, { squad_request: [] }));
  assert.ok(md.includes('Pode reformular'));
});

console.log('\n' + ok + ' testes passaram.');
