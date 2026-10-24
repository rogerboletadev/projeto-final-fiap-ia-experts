// Motor de cálculo do Squad Cost Copilot.
// Sem dependências: roda no Node, no Code node do n8n e no navegador.
// A IA entende o pedido. Quem calcula é este código.

// <<CORE-START>>
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, ' ');
}

// Aceita "janeiro", "Jan", "marco" (sem cedilha). Retorna o índice 0-11 ou -1.
function acharMes(txt) {
  const t = norm(txt);
  if (!t) return -1;
  return MESES.findIndex(m => norm(m) === t || (t.length >= 3 && norm(m).startsWith(t)));
}

// Casa o cargo pelo nome exato do catálogo (sem acento e sem diferença de caixa).
// Se não casar, devolve sugestões para o bot perguntar de volta.
function acharCargo(data, txt) {
  const t = norm(txt);
  const exato = data.cargos.find(c => norm(c.cargo) === t);
  if (exato) return { cargo: exato };
  const sinonimos = {
    dev: 'desenvolvedor', developer: 'desenvolvedor', back: 'backend', front: 'frontend',
    fullstack: 'full', qa: 'testes', teste: 'testes', tester: 'testes',
    lider: 'lider', lead: 'lider', tech: 'tecnico'
  };
  const tokens = t.split(' ').filter(x => x.length > 1).map(x => sinonimos[x] || x);
  const sugestoes = data.cargos
    .filter(c => tokens.some(k => norm(c.cargo).includes(k)))
    .slice(0, 5)
    .map(c => c.cargo);
  return { sugestoes };
}

function arred2(n) { return Math.round(n * 100) / 100; }

// pedido = { mes_inicio, mes_fim, squad_request: [{ cargo, quantidade }] }
function simular(data, pedido) {
  const erros = [];
  pedido = pedido || {};

  const vazio = v => v == null || String(v).trim() === '';
  const mi = vazio(pedido.mes_inicio) ? 0 : acharMes(pedido.mes_inicio);
  const mf = vazio(pedido.mes_fim) ? 11 : acharMes(pedido.mes_fim);
  if (mi < 0) erros.push('Mês de início inválido: "' + pedido.mes_inicio + '".');
  if (mf < 0) erros.push('Mês de fim inválido: "' + pedido.mes_fim + '".');
  if (mi >= 0 && mf >= 0 && mf < mi) {
    erros.push('O mês final (' + MESES[mf] + ') vem antes do mês inicial (' + MESES[mi] + ').');
  }

  const req = Array.isArray(pedido.squad_request) ? pedido.squad_request : [];
  if (!req.length) erros.push('Nenhum cargo foi informado no pedido.');

  const agrupado = new Map();
  req.forEach(r => {
    const q = Number(r && r.quantidade);
    if (!Number.isInteger(q) || q <= 0) {
      erros.push('Quantidade inválida para "' + (r && r.cargo) + '". Use um número inteiro maior que zero.');
      return;
    }
    const m = acharCargo(data, r.cargo);
    if (!m.cargo) {
      erros.push('Cargo fora do catálogo: "' + r.cargo + '".' +
        (m.sugestoes.length ? ' Opções parecidas: ' + m.sugestoes.join('; ') + '.' : ''));
      return;
    }
    agrupado.set(m.cargo.cargo, (agrupado.get(m.cargo.cargo) || 0) + q);
  });

  if (erros.length) return { ok: false, erros };

  const meses = MESES.slice(mi, mf + 1);
  const faltando = meses.filter(m => typeof data.horas[m] !== 'number');
  if (faltando.length) {
    return { ok: false, erros: ['Sem horas úteis cadastradas para: ' + faltando.join(', ') + '.'] };
  }
  const horas = meses.reduce((s, m) => s + data.horas[m], 0);

  const resultados = data.consultorias.map(c => {
    const itens = Array.from(agrupado.entries()).map(([cargo, quantidade]) => {
      const base = data.cargos.find(x => x.cargo === cargo).base;
      const valorHora = base * c.fator;
      return {
        cargo,
        quantidade,
        valor_hora: Math.round(valorHora * 10000) / 10000,
        custo: arred2(valorHora * horas * quantidade)
      };
    });
    const total = arred2(itens.reduce((s, i) => s + i.custo, 0));
    return { consultoria: c.nome, fator: c.fator, itens, total };
  });

  const ordenado = resultados.slice().sort((a, b) => a.total - b.total);
  const maisBarata = ordenado[0];
  resultados.forEach(r => {
    r.diferenca = arred2(r.total - maisBarata.total);
    r.diferenca_pct = maisBarata.total ? Math.round((r.diferenca / maisBarata.total) * 10000) / 100 : 0;
  });

  return {
    ok: true,
    periodo: { inicio: MESES[mi], fim: MESES[mf], meses: meses.length, horas },
    squad: Array.from(agrupado.entries()).map(([cargo, quantidade]) => ({ cargo, quantidade })),
    resultados,
    mais_barata: maisBarata.consultoria
  };
}

function brl(n) {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Monta a resposta em Markdown. A tabela é feita aqui, não pelo LLM, para os números não mudarem.
function formatarMarkdown(res) {
  if (!res.ok) {
    return 'Não consegui montar a simulação:\n' +
      res.erros.map(e => '- ' + e).join('\n') +
      '\n\nPode reformular o pedido?';
  }
  const p = res.periodo;
  const out = [];
  out.push('**Simulação de custo**');
  out.push('Período: ' + p.inicio + ' a ' + p.fim + ' (' + p.horas + ' horas úteis)');
  out.push('Squad: ' + res.squad.map(s => s.quantidade + 'x ' + s.cargo).join(', '));
  out.push('');
  out.push('| Consultoria | Custo total | Diferença para a mais barata |');
  out.push('|---|---:|---:|');
  res.resultados.forEach(r => {
    const pct = String(r.diferenca_pct).replace('.', ',');
    const dif = r.diferenca === 0 ? 'mais barata' : '+' + brl(r.diferenca) + ' (+' + pct + '%)';
    out.push('| ' + r.consultoria + ' | ' + brl(r.total) + ' | ' + dif + ' |');
  });
  out.push('');
  out.push('**Detalhe por cargo**');
  out.push('| Cargo | Qtd | ' + res.resultados.map(r => r.consultoria).join(' | ') + ' |');
  out.push('|---|---:|' + res.resultados.map(() => '---:').join('|') + '|');
  res.squad.forEach((s, idx) => {
    out.push('| ' + s.cargo + ' | ' + s.quantidade + ' | ' +
      res.resultados.map(r => brl(r.itens[idx].custo)).join(' | ') + ' |');
  });
  out.push('');
  out.push('Menor custo no período: **' + res.mais_barata + '**.');
  return out.join('\n');
}
// <<CORE-END>>

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MESES, acharMes, acharCargo, simular, formatarMarkdown, brl };
}
