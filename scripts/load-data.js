// Lê os CSVs da pasta data/ e devolve o objeto de dados usado pelo motor.
const fs = require('fs');
const path = require('path');

function lerCsv(arquivo) {
  const txt = fs.readFileSync(path.join(__dirname, '..', 'data', arquivo), 'utf8');
  const linhas = txt.split(/\r?\n/).filter(l => l.trim() !== '');
  const cab = linhas[0].split(',').map(s => s.trim());
  return linhas.slice(1).map(l => {
    const cols = l.split(',').map(s => s.trim());
    const o = {};
    cab.forEach((c, i) => { o[c] = cols[i]; });
    return o;
  });
}

function loadData() {
  const cargos = lerCsv('cargos.csv').map(r => ({ cargo: r.cargo, base: Number(r.valor_hora_base) }));
  const consultorias = lerCsv('consultorias.csv').map(r => ({ nome: r.consultoria, fator: Number(r.fator) }));
  const horas = {};
  lerCsv('horas_uteis.csv').forEach(r => { horas[r.mes] = Number(r.horas); });

  // Validações simples para não subir base quebrada.
  const erros = [];
  cargos.forEach(c => { if (!(c.base > 0)) erros.push('Valor base inválido: ' + c.cargo); });
  consultorias.forEach(c => { if (!(c.fator > 0)) erros.push('Fator inválido: ' + c.nome); });
  if (Object.keys(horas).length !== 12) erros.push('horas_uteis.csv deve ter 12 meses.');
  if (erros.length) throw new Error('Base de dados inválida:\n- ' + erros.join('\n- '));

  return { cargos, consultorias, horas };
}

module.exports = { loadData };
