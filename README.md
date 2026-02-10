# umo

<p align="center">
  <img src="https://github.com/gepetojj/umo/raw/main/.github/assets/logo-p%26d.png" alt="Logo do Departamento de Pesquisa e Desenvolvimento - Link Soluções" width="200" />
</p>

**umo** é um projeto de pesquisa do **Departamento de Pesquisa da Link Soluções** que explora o uso de modelos de linguagem e de fala para transformar reuniões em artefatos estruturados e conversacionais.

---

## Visão geral

O umo é um *proof of concept* que integra **gravação de áudio em tempo real**, **transcrição automática** e **assistência conversacional baseada em IA** em um único fluxo. O objetivo é avaliar, em ambiente controlado, a viabilidade de pipelines que convertem reuniões em texto, resumos e um assistente capaz de responder perguntas sobre o que foi discutido.

O sistema não substitui ferramentas de reunião em produção; serve como base experimental para decisões de produto e de arquitetura no âmbito do P&D.

---

## Motivação

Reuniões geram grande volume de informação não estruturada. A recuperação posterior de decisões, action items e contexto costuma depender de anotações manuais ou de memória. O departamento de pesquisa investiga:

- **Transcrição automática** de áudio de reuniões em português, com foco em qualidade e latência.
- **Resumos estruturados** (resumo executivo, action items, tarefas, análises) gerados a partir da transcrição.
- **Interação em linguagem natural** sobre o conteúdo da reunião (perguntas e respostas fundamentadas na transcrição).

O umo materializa esse pipeline de ponta a ponta para permitir experimentos, medições e iterações em modelos, prompts e fluxos de dados.

---

## Técnicas e experimentos

### Pipeline de áudio e transcrição

- **Captura**: uso da API `MediaRecorder` com *timeslicing* (blocos de 10 s) para gravação no navegador em WebM/Opus, com upload incremental dos chunks para armazenamento (S3-compatível).
- **Consolidação**: os chunks são concatenados em um único arquivo WebM (o primeiro contém o header; os demais são segmentos de mídia), preservando a compatibilidade com o formato esperado pelo modelo de fala.
- **Transcrição**: um único request ao **Whisper Large V3 Turbo** (via Cloudflare Workers AI) sobre o áudio completo e *VAD* habilitado, produzindo texto e opcionalmente VTT.

### Processamento com modelos de linguagem

- **Resumo da reunião**: um LLM (via Cloudflare) recebe a transcrição e gera um markdown estruturado com seções fixas: *Resumo*, *Action items*, *Tarefas*, *Análises gerais*. A saída é persistida como primeira mensagem do assistente no chat da reunião.
- **Título**: o mesmo transcrição é usada para extrair um título curto (até ~7 palavras) via prompt dedicado.
- **Chat contextual**: o endpoint de chat injeta a transcrição no *system prompt* do modelo; as respostas são condicionadas estritamente ao conteúdo da reunião, em português.

### Stack e arquitetura

- **Frontend**: Next.js 16 (App Router), React 19, interface de gravação e chat com componentes acessíveis.
- **Backend**: server actions e rotas de API (chat em streaming).
- **Persistência**: PostgreSQL (Neon) com Drizzle ORM; objetos (chunks e gravação final) em armazenamento S3-compatível.
- **IA**: Cloudflare AI Gateway

Os experimentos atuais centram-se em: qualidade da transcrição em PT-BR, adequação dos prompts de resumo e título, e comportamento do chat quando o contexto é apenas a transcrição.
