// Gerado por scripts/build.js a partir do README.md. Não edite à mão.
const DIAGRAMAS = [
  {
    "titulo": "MVP 1: como está hoje",
    "codigo": "flowchart TB\n  subgraph DADOS[\"data/ · fonte única da verdade\"]\n    direction LR\n    CSV1[cargos.csv]\n    CSV2[consultorias.csv]\n    CSV3[horas_uteis.csv]\n    CSV4[modelos.csv]\n  end\n\n  subgraph BUILD[\"scripts/build.js\"]\n    LOAD[\"load-data.js<br/>lê e valida os CSVs\"]\n    CORE[\"core/simulador.js<br/>motor de cálculo\"]\n    TESTES[\"core/simulador.test.js<br/>15 testes\"]\n  end\n\n  subgraph SITE[\"web/ · site estático na Vercel\"]\n    DATAJS[data.js + simulador.js]\n    SIM[\"Simulador e modelos X, Y, Z<br/>calcula no navegador\"]\n    CHAT[Chat]\n    CONF[\"Configuração<br/>URL do webhook\"]\n  end\n\n  subgraph N8N[\"n8n\"]\n    WH[Webhook]\n    LLM[\"Gemini ou Claude<br/>extrai o pedido em JSON\"]\n    CODE[\"Code node<br/>code-node.js com dados embutidos\"]\n    RESP[Respond to Webhook]\n  end\n\n  DADOS --> LOAD --> CORE\n  CORE -.-> TESTES\n  CORE --> DATAJS --> SIM\n  CORE --> CODE\n  LOAD --> PROMPT[\"prompt-extracao.md<br/>catálogo de cargos e modelos\"] --> LLM\n  CONF -.-> CHAT\n  CHAT -- \"POST chatInput\" --> WH --> LLM --> CODE --> RESP -- \"output em Markdown\" --> CHAT\n"
  },
  {
    "titulo": "Caminho de uma pergunta no chat",
    "codigo": "sequenceDiagram\n  actor C as Coordenador\n  participant W as Site (chat.html)\n  participant N as n8n Webhook\n  participant L as Gemini ou Claude\n  participant K as Code node\n\n  C->>W: \"Quanto custa o super power squad no ano?\"\n  W->>N: POST { chatInput, sessionId }\n  N->>L: texto + prompt com catálogo e modelos\n  L-->>N: { modelo: \"Z\", squad_request, fora_da_conta }\n  N->>K: JSON do pedido\n  K->>K: valida cargos e calcula<br/>horas úteis × valor/hora × quantidade\n  K-->>N: { output: tabelas em Markdown }\n  N-->>W: resposta\n  W-->>C: comparação entre as 4 consultorias\n"
  },
  {
    "titulo": "Etapas dos MVPs",
    "codigo": "flowchart TB\n  M1[\"MVP 1 · pronto<br/>Simulador, modelos X/Y/Z,<br/>chat via n8n, dados em CSV\"]\n  M2[\"MVP 2 · próximo<br/>Valores reais do Connecti<br/>no lugar dos CSVs\"]\n  M3[\"MVP 3<br/>Contratos com RAG:<br/>reajuste, vigência, cotas\"]\n  M4[\"MVP 4<br/>Acompanhamento do squad:<br/>previsto × realizado, alertas,<br/>agente no LangGraph\"]\n  M5[\"MVP 5<br/>Custo-benefício:<br/>histórico de entrega + preço,<br/>ferramentas via MCP\"]\n\n  M1 --> M2 --> M3 --> M4 --> M5\n\n  classDef pronto fill:#d6f5e8,stroke:#0b7a57,color:#0b3d2c\n  classDef proximo fill:#dfe6ff,stroke:#1f4fff,color:#0c1f66\n  classDef futuro fill:#f3f5f8,stroke:#9aa6bc,color:#334\n  class M1 pronto\n  class M2 proximo\n  class M3,M4,M5 futuro\n"
  },
  {
    "titulo": "Arquitetura alvo",
    "codigo": "flowchart LR\n  U[Coordenador] --> UI[\"Site / Chat\"]\n  UI --> AG[\"Agente LangGraph<br/>decide o caminho\"]\n\n  AG --> CALC[\"Motor de cálculo<br/>(MVP 1)\"]\n  AG -.-> RAG[\"RAG de contratos<br/>(MVP 3)\"]\n  AG -.-> ACOMP[\"Acompanhamento<br/>previsto × realizado (MVP 4)\"]\n  AG -.-> CB[\"Custo-benefício<br/>(MVP 5)\"]\n\n  CONNECTI[(\"Connecti<br/>valores reais\")] -. \"sync agendado (MVP 2)\" .-> BASE[(\"Base de valores\")]\n  BASE --> CALC\n  CONTRATOS[(\"Contratos\")] -.-> VET[(\"Banco vetorial\")] -.-> RAG\n  HIST[(\"Histórico de entrega\")] -.-> CB\n  CALC -. \"ferramentas via MCP\" .-> MCP[Outros agentes e ferramentas]\n"
  }
];
