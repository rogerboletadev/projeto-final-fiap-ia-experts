(function () {
  var D = SQUAD_DATA;
  var CORES = {
    'Consultoria A': 'var(--ca)',
    'Consultoria B': 'var(--cb)',
    'Consultoria C': 'var(--cc)',
    'Consultoria D': 'var(--cd)'
  };

  var EXEMPLOS = {
    pedido: {
      ini: 'Janeiro', fim: 'Junho',
      linhas: [
        { cargo: 'Desenvolvedor Backend N3', qtd: 2 },
        { cargo: 'Desenvolvedor Full Stack N3', qtd: 1 }
      ]
    },
    squad: {
      ini: 'Janeiro', fim: 'Dezembro',
      linhas: [
        { cargo: 'Desenvolvedor Full Stack N3', qtd: 1 },
        { cargo: 'Desenvolvedor Backend N3', qtd: 2 },
        { cargo: 'Desenvolvedor Frontend N3', qtd: 1 },
        { cargo: 'Analista de Testes N2', qtd: 1 }
      ]
    },
    power: {
      ini: 'Janeiro', fim: 'Dezembro',
      linhas: [
        { cargo: 'Desenvolvedor Full Stack N3', qtd: 2 }
      ]
    }
  };

  var elIni = document.getElementById('mes-ini');
  var elFim = document.getElementById('mes-fim');
  var elLinhas = document.getElementById('linhas');
  var elSaida = document.getElementById('saida');
  var estado = { linhas: [] };

  function opcoesMeses(sel, valor) {
    MESES.forEach(function (m) {
      var o = document.createElement('option');
      o.value = m; o.textContent = m;
      sel.appendChild(o);
    });
    sel.value = valor;
  }

  function criarLinha(idx, linha) {
    var wrap = document.createElement('div');
    wrap.className = 'linha';

    var sel = document.createElement('select');
    sel.className = 'cargo-sel';
    sel.setAttribute('aria-label', 'Cargo ' + (idx + 1));
    D.cargos.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.cargo; o.textContent = c.cargo;
      sel.appendChild(o);
    });
    sel.value = linha.cargo;
    sel.addEventListener('change', function () { estado.linhas[idx].cargo = sel.value; render(); });

    var qtd = document.createElement('input');
    qtd.type = 'number'; qtd.min = '1'; qtd.step = '1'; qtd.inputMode = 'numeric';
    qtd.value = String(linha.qtd);
    qtd.addEventListener('input', function () { estado.linhas[idx].qtd = qtd.value; render(); });
    var rotuloQtd = document.createElement('label');
    rotuloQtd.className = 'qtd';
    rotuloQtd.appendChild(document.createTextNode('Quantidade'));
    rotuloQtd.appendChild(qtd);

    var rm = document.createElement('button');
    rm.type = 'button'; rm.className = 'remover'; rm.textContent = '×';
    rm.setAttribute('aria-label', 'Remover cargo ' + (idx + 1));
    rm.addEventListener('click', function () {
      estado.linhas.splice(idx, 1);
      desenharLinhas();
      render();
    });

    wrap.appendChild(sel); wrap.appendChild(rotuloQtd); wrap.appendChild(rm);
    return wrap;
  }

  function desenharLinhas() {
    elLinhas.textContent = '';
    estado.linhas.forEach(function (l, i) { elLinhas.appendChild(criarLinha(i, l)); });
  }

  function carregarExemplo(chave) {
    var e = EXEMPLOS[chave];
    elIni.value = e.ini;
    elFim.value = e.fim;
    estado.linhas = e.linhas.map(function (l) { return { cargo: l.cargo, qtd: l.qtd }; });
    desenharLinhas();
    render();
  }

  // Compara o squad tradicional com o power squad na consultoria mais barata de cada um.
  function compararFormatos() {
    var alvo = document.getElementById('formatos');
    if (!alvo) return;
    function custo(chave) {
      var e = EXEMPLOS[chave];
      var r = simular(D, {
        mes_inicio: e.ini, mes_fim: e.fim,
        squad_request: e.linhas.map(function (l) { return { cargo: l.cargo, quantidade: l.qtd }; })
      });
      var melhor = r.resultados.filter(function (x) { return x.consultoria === r.mais_barata; })[0];
      return { total: melhor.total, consultoria: r.mais_barata };
    }
    var trad = custo('squad');
    var power = custo('power');
    document.getElementById('custo-squad').textContent = brl(trad.total);
    document.getElementById('custo-power').textContent = brl(power.total);
    document.getElementById('economia').textContent = brl(trad.total - power.total) + ' (' +
      pct(Math.round((1 - power.total / trad.total) * 1000) / 10) + '%)';
  }

  function pct(n) { return String(n).replace('.', ','); }

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function render() {
    var pedido = {
      mes_inicio: elIni.value,
      mes_fim: elFim.value,
      squad_request: estado.linhas.map(function (l) { return { cargo: l.cargo, quantidade: Number(l.qtd) }; })
    };
    elSaida.textContent = '';

    if (!estado.linhas.length) {
      elSaida.appendChild(el('h2', null, 'Custo no período'));
      elSaida.appendChild(el('p', 'vazio', 'Adicione ao menos um cargo para ver a comparação.'));
      return;
    }

    var r = simular(D, pedido);
    if (!r.ok) {
      elSaida.appendChild(el('h2', null, 'Ajuste o pedido'));
      var ul = el('ul', 'erro-lista');
      r.erros.forEach(function (e) { ul.appendChild(el('li', null, e)); });
      elSaida.appendChild(ul);
      return;
    }

    elSaida.appendChild(el('h2', null, 'Custo no período'));
    elSaida.appendChild(el('p', 'resumo',
      r.periodo.inicio + ' a ' + r.periodo.fim + ', ' + r.periodo.horas + ' horas úteis. ' +
      r.squad.reduce(function (s, x) { return s + x.quantidade; }, 0) + ' pessoa(s) no squad.'));

    var ordenado = r.resultados.slice().sort(function (a, b) { return a.total - b.total; });
    var maximo = ordenado[ordenado.length - 1].total;
    var lista = el('ul', 'barras');
    lista.style.listStyle = 'none';

    ordenado.forEach(function (c, i) {
      var li = document.createElement('li');
      var topo = el('div', 'barra-topo');
      var nome = el('span', 'barra-nome');
      var ponto = el('span', 'ponto');
      ponto.style.background = CORES[c.consultoria] || 'var(--accent)';
      nome.appendChild(ponto);
      nome.appendChild(document.createTextNode(c.consultoria));
      topo.appendChild(nome);
      topo.appendChild(el('span', 'barra-total', brl(c.total)));

      var trilho = el('div', 'trilho');
      trilho.setAttribute('aria-hidden', 'true');
      var pre = el('div', 'preenche');
      pre.style.background = CORES[c.consultoria] || 'var(--accent)';
      trilho.appendChild(pre);

      var nota = i === 0
        ? el('p', 'barra-nota melhor', 'Mais barata')
        : el('p', 'barra-nota', '+' + brl(c.diferenca) + ' (+' + pct(c.diferenca_pct) + '%) em relação à mais barata');

      li.appendChild(topo); li.appendChild(trilho); li.appendChild(nota);
      lista.appendChild(li);
      // anima a barra depois de inserir no DOM
      requestAnimationFrame(function () { pre.style.width = (maximo ? (c.total / maximo) * 100 : 0) + '%'; });
    });
    elSaida.appendChild(lista);

    // detalhe por cargo
    var det = el('details', 'detalhe');
    det.appendChild(el('summary', null, 'Ver detalhe por cargo'));
    var rol = el('div', 'rolagem');
    var tab = document.createElement('table');
    var cab = document.createElement('thead');
    var trc = document.createElement('tr');
    ['Cargo', 'Qtd'].concat(r.resultados.map(function (x) { return x.consultoria; })).forEach(function (t) {
      trc.appendChild(el('th', null, t));
    });
    cab.appendChild(trc); tab.appendChild(cab);
    var corpo = document.createElement('tbody');
    r.squad.forEach(function (s, idx) {
      var tr = document.createElement('tr');
      tr.appendChild(el('td', null, s.cargo));
      tr.appendChild(el('td', null, String(s.quantidade)));
      r.resultados.forEach(function (x) { tr.appendChild(el('td', null, brl(x.itens[idx].custo))); });
      corpo.appendChild(tr);
    });
    tab.appendChild(corpo); rol.appendChild(tab); det.appendChild(rol);
    elSaida.appendChild(det);
  }

  // eventos
  opcoesMeses(elIni, 'Janeiro');
  opcoesMeses(elFim, 'Junho');
  elIni.addEventListener('change', render);
  elFim.addEventListener('change', render);
  document.getElementById('add').addEventListener('click', function () {
    estado.linhas.push({ cargo: D.cargos[0].cargo, qtd: 1 });
    desenharLinhas();
    render();
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-exemplo]'), function (b) {
    b.addEventListener('click', function () {
      carregarExemplo(b.getAttribute('data-exemplo'));
      if (b.hasAttribute('data-rolar')) document.getElementById('simulador').scrollIntoView({ behavior: 'smooth' });
    });
  });

  carregarExemplo('pedido');
  compararFormatos();
})();
