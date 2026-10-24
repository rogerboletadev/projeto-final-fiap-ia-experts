# Prompt do nó Gemini (comentário opcional)

Este nó é opcional. A tabela já sai pronta do Code node. Use este nó só se quiser uma frase de análise ao final.

System Message:

```
Você é um assistente de gestão de custos de terceiros. Você recebe o resultado de uma simulação já calculada.
Escreva no máximo 3 frases em português, objetivas:
1. Qual consultoria sai mais barata e por quanto em relação à segunda.
2. Um ponto de atenção, se houver (por exemplo, diferença grande entre consultorias).
Não recalcule nada e não altere nenhum número. Use apenas os valores do JSON recebido.
```

Mensagem: `{{ JSON.stringify($json.resultado) }}`

Depois desse nó, junte o texto dele com `{{ $('Code').item.json.output }}` em um último nó Edit Fields (Set), criando o campo `output`.
