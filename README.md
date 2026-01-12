# 🔥 Brasa Bot - Gerenciador de Churrasco Serverless

Um bot de Discord completo para organizar churrascos e eventos entre amigos, com geração automática de PIX e gestão financeira em tempo real.

## 🚀 Funcionalidades

- **Criação de Eventos:** Comando `/brasa novo` define título, data, valor e chave PIX.
- **Lista de Presença:** Botões interativos "Vou" e "Não Vou" com atualização em tempo real.
- **Pagamentos via PIX:** Gera automaticamente o código **Pix Copia e Cola** (Padrão EMV) para facilitar o pagamento no app do banco.
- **Painel de Gestão:** Menu exclusivo para o organizador confirmar quem pagou (marcando com 💲) ou cancelar o evento.
- **Cancelamento Inteligente:** Ao cancelar um evento, o card público é atualizado e as interações são bloqueadas.
- **Arquitetura Serverless:** Roda 100% na borda (Edge) sem servidor ligado 24h.

## 🛠️ Stack Tecnológica

- **Cloudflare Workers:** Infraestrutura de hospedagem e computação serverless.
- **Firebase Firestore (Lite):** Banco de dados NoSQL para persistência dos eventos e participantes.
- **Discord Interactions API:** Uso de Webhooks, Slash Commands, Botões e Select Menus.
- **Node.js (v24):** Runtime moderno usando `fetch` nativo.

## ⚙️ Configuração Local

### Pré-requisitos
- Conta no Cloudflare Workers.
- Projeto no Firebase (Firestore em modo de teste ou regras configuradas).
- Aplicação criada no Discord Developer Portal.

### Instalação

1. Clone o repositório:
   ```bash
   git clone [https://github.com/BryanWalace/brasa-bot.git](https://github.com/BryanWalace/brasa-bot.git)
   cd brasa-bot