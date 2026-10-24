# Squad Cost Copilot (MVP v1)

Assistente que compara o custo de montar um squad em cada consultoria de terceiros.
A IA entende o pedido em linguagem natural. O código faz a conta.

Projeto de estudo do curso FIAP Experts. Todos os dados são fictícios.

## O que tem aqui

```
data/       base limpa (fonte única da verdade)
  cargos.csv          cargo e valor/hora base (os valores da Consultoria A)
  consultorias.csv    consultoria e fator (A=1, B=1,1273, C=1,2169, D=1,3147)
  horas_uteis.csv     horas úteis por mês
core/       motor de cálculo + testes (sem dependências)
scripts/    build.js gera os arquivos do n8n e da página a partir dos CSVs
n8n/        o que colar no n8n: code-node.js e os prompts
web/        landing page com simulador e guia do n8n (pronta para a Vercel)
```

Regra de cálculo: `valor/hora = base do cargo x fator da consultoria` e
`custo = horas úteis do período x valor/hora x quantidade`.

## Rodar os testes

```bash
node core/simulador.test.js
```

São 13 testes. Um deles confere o total da Consultoria B (R$ 713.693,63) calculado à mão.

Depois de mudar qualquer CSV, rode `node scripts/build.js` para regenerar `n8n/code-node.js`,
`n8n/prompt-extracao.md` e os arquivos da página.

## Montar o fluxo no n8n

O mesmo passo a passo, com botões de copiar para o prompt e o código, está na página `web/guia-n8n.html`
(ela também explica por que o n8n é uma boa escolha e onde ele tem limite).

Nós, nesta ordem:

1. **Chat Trigger.** Sem configuração. A mensagem chega em `{{ $json.chatInput }}`.
2. **Google Gemini (Message a model).**
   - System Message: copie o bloco de `n8n/prompt-extracao.md`.
   - Mensagem: `{{ $json.chatInput }}`.
   - Peça resposta em JSON se o nó tiver essa opção.
3. **Code.** Language: JavaScript. Mode: Run Once for All Items. Cole o conteúdo de `n8n/code-node.js`.
   Os dados já vão embutidos no arquivo, então não precisa ler CSV nem instalar pandas.
4. **(Opcional) Gemini de comentário.** Veja `n8n/prompt-comentario.md`.

O Chat Trigger devolve o campo `output` do último nó. Se a resposta vier vazia, confira o nome do campo.

O Code node tenta ler o texto do Gemini em `text`, `output` ou `content.parts[0].text`. Se a sua versão
do nó devolver em outro lugar, ajuste só a parte "Entrada" no fim do arquivo.

**Não testado no n8n real.** Eu testei o código simulando a entrada do nó, mas não rodei o fluxo dentro do
n8n. Se algum nome de campo for diferente na sua versão, é um ajuste de uma linha.

## Publicar a página na Vercel

A pasta `web/` é um site estático. Não precisa de build.

Opção A, pela linha de comando:

```bash
cd web
npx vercel        # primeiro deploy (teste)
npx vercel --prod # produção
```

Opção B, pelo GitHub:

1. Suba o projeto inteiro para um repositório.
2. Na Vercel: Add New, Project, escolha o repositório.
3. Em **Root Directory** selecione `web`. Framework Preset: Other. Deixe Build Command vazio.

## Pontos de atenção

- **Backend N1 da Consultoria B.** Na planilha original está 133,56, mas pela regra base x fator deveria
  ser 112,73. É a única das 68 linhas que foge da regra. Na base nova esse valor é calculado, então o erro some.
  Vale confirmar qual é o valor correto no contrato.
- **Júnior, pleno, sênior.** O prompt assume que significam N1, N2, N3. É uma hipótese, confirme com a empresa.
- **Dados reais.** Valor/hora de terceiros é dado contratual sensível. Antes de usar dados do Connecti
  ou um LLM em nuvem com dados reais, alinhe com segurança.

## Próximas versões

- **v2:** RAG com os contratos (reajuste, vigência, troca de nível, cotas). Chunking, embeddings, banco vetorial.
- **v3:** agente no LangGraph decidindo o caminho (cálculo ou contrato), previsto x realizado por squad, alertas.
- **Depois:** expor o cálculo como ferramentas via MCP e definir o que é "benefício" além do preço.
