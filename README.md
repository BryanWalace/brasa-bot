# 🔥 Brasa Bot - Gerenciador de Churrasco Serverless

<div align="center">

![Status](https://img.shields.io/badge/status-ativo-success.svg)
![License](https://img.shields.io/badge/license-Beerware-orange.svg)
![Node](https://img.shields.io/badge/node-24%2B-brightgreen.svg)
![Cloudflare](https://img.shields.io/badge/cloudflare-workers-f38020.svg)

**Um bot de Discord completo para organizar churrascos e eventos entre amigos, com geração automática de PIX e gestão financeira em tempo real.**

</div>

---

## � Sobre o Projeto

O **Brasa Bot** é um bot de Discord open-source que facilita a organização de churrascos, festas e eventos entre amigos. Ele roda 100% na **borda (Edge)** usando **Cloudflare Workers**, sem necessidade de servidores ligados 24h, e utiliza **Firebase Firestore** para persistência de dados. Oferece integração nativa com **PIX** para pagamentos simplificados.

### 🎯 Por que usar o Brasa Bot?

- ✅ **Zero Infraestrutura:** Serverless completo, sem custos de servidor
- ✅ **Pagamentos Facilitados:** Gera códigos "Pix Copia e Cola" (Padrão EMV) automaticamente
- ✅ **Gestão Inteligente:** Painel exclusivo para o organizador controlar quem pagou
- ✅ **Multi-Servidor:** Funciona em quantos servidores Discord você quiser simultaneamente
- ✅ **Open Source:** Código aberto, personalizável e gratuito

---

## ✨ Funcionalidades

### 🎪 Criação de Eventos com `/brasa novo`
Crie eventos completos com um único comando:
- **Título:** Nome do evento (ex: "Churras de Fim de Ano")
- **Data:** Quando vai acontecer (ex: "20/12 às 14h")
- **Valor:** Quanto cada pessoa vai pagar (opcional)
- **Chave PIX:** Sua chave para receber os pagamentos (opcional)

### 👥 Presença em Tempo Real
- Botões interativos **"Vou"** e **"Não Vou"** para confirmar presença
- Lista de confirmados atualizada automaticamente
- Contador de participantes em tempo real

### 💰 Geração Nativa de PIX Copia e Cola (Padrão EMV)
- Botão **"Pagar"** gera o código Pix oficial dos bancos brasileiros
- Implementação do padrão EMV QRCPS-MPM completo
- Valor já preenchido, basta colar no app do banco
- Mensagem efêmera (apenas quem clica visualiza o código)

### 👑 Painel do Dono (Gerenciar/Cancelar)
- Botão **"Gerenciar"** exclusivo para quem criou o evento
- Menu dropdown para marcar quem já pagou (adiciona ícone 💲)
- Opção de cancelar/encerrar o evento
- Ao cancelar, o card é atualizado e as interações são bloqueadas

### 🌐 Arquitetura Serverless
- Roda 100% no Cloudflare Workers (Edge Computing)
- Sistema de "Defer" para evitar timeouts do Discord
- Funciona globalmente em múltiplos servidores
- Escalabilidade automática sem configuração

---

## 🛠️ Tech Stack

| Tecnologia | Uso |
|------------|-----|
| **Cloudflare Workers** | Hospedagem serverless na borda (Edge Computing) |
| **Firebase Firestore Lite** | Banco de dados NoSQL para eventos e participantes |
| **Node.js v24+** | Runtime moderno com `fetch` nativo |
| **Discord Interactions API** | Slash Commands, Buttons, Select Menus |
| **Wrangler** | CLI para deploy e gerenciamento de secrets |

---

## 🚀 Instalação

### Pré-requisitos

- ✅ Conta no [Cloudflare Workers](https://workers.cloudflare.com/) (plano gratuito funciona)
- ✅ Projeto no [Firebase](https://console.firebase.google.com/) com Firestore ativado
- ✅ Aplicação criada no [Discord Developer Portal](https://discord.com/developers/applications)
- ✅ Node.js v24 ou superior instalado

### Passo 1: Clone o Repositório

```bash
git clone https://github.com/BryanWalace/brasa-bot.git
cd brasa-bot
```

### Passo 2: Instale as Dependências

```bash
npm install
```

### Passo 3: Configure os Secrets do Cloudflare

O projeto usa **Wrangler Secrets** para proteger suas credenciais sensíveis:

```bash
# Token do bot (Discord Developer Portal > Bot > Token)
npx wrangler secret put DISCORD_TOKEN

# Chave pública do Discord (Developer Portal > General Information)
npx wrangler secret put DISCORD_PUBLIC_KEY

# ID da aplicação (Developer Portal > General Information > Application ID)
npx wrangler secret put DISCORD_APP_ID

# Configuração do Firebase (baixe o JSON no Firebase Console)
# Cole o conteúdo inteiro do arquivo como uma string JSON
npx wrangler secret put FIREBASE_CONFIG
```

### Passo 4: Registre os Comandos do Discord

Renomeie o arquivo de exemplo e configure seus dados:

```bash
cp register-example.js register.js
```

Edite o arquivo `register.js` e substitua:
- `SEU_TOKEN_DO_BOT_AQUI` pelo token do bot
- `SEU_APP_ID_AQUI` pelo ID da aplicação

Execute o script para registrar os comandos globalmente:

```bash
node register.js
```

> **💡 Nota:** Os comandos globais podem levar até 1 hora para aparecer em novos servidores.

### Passo 5: Faça o Deploy

```bash
npx wrangler deploy
```

### Passo 6: Configure a URL de Interações no Discord

1. Copie a URL gerada pelo deploy (ex: `https://brasa-bot.seu-usuario.workers.dev`)
2. No Discord Developer Portal, vá em **General Information > Interactions Endpoint URL**
3. Cole a URL e salve
4. O Discord fará um teste de verificação automático ✅

### Passo 7: Adicione o Bot ao Servidor

1. No Developer Portal, vá em **OAuth2 > URL Generator**
2. Marque os scopes: `bot` e `applications.commands`
3. Marque as permissões: `Send Messages`, `Embed Links`, `Use Slash Commands`
4. Copie a URL gerada e abra no navegador
5. Selecione o servidor e autorize

---

## 🔒 Segurança

Este projeto implementa as melhores práticas de segurança:

- ✅ **Secrets Protegidos:** Todas as chaves sensíveis são armazenadas como Wrangler Secrets, nunca em arquivos `.env`
- ✅ **Gitignore Configurado:** Arquivos sensíveis (`register.js`, `register-global.js`, `*.log`) são ignorados pelo Git
- ✅ **Verificação de Assinatura:** Todas as requisições do Discord são verificadas usando a chave pública ED25519
- ✅ **Sem Exposição de Tokens:** Nenhuma credencial é commitada no repositório

---

## 🎮 Como Usar

### Criar um Evento

```
/brasa novo titulo:Churras do Fim de Ano data:20/12 às 14h valor:35.50 chave_pix:seu@email.com
```

### Confirmar Presença

Clique no botão **"Vou"** no card do evento.

### Pagar

Clique no botão **"Pagar"** e copie o código Pix gerado. Cole no app do seu banco.

### Gerenciar (Organizador)

Clique no botão **"Gerenciar"** para:
- Marcar quem já pagou (aparece 💲 na lista)
- Cancelar/encerrar o evento

---

## 🏗️ Estrutura do Projeto

```
brasa-bot/
├── src/
│   ├── index.js              # Entry point do Worker
│   ├── core/
│   │   └── security.js       # Verificação de assinatura do Discord
│   ├── database/
│   │   └── firebase.js       # Funções do Firestore
│   ├── services/
│   │   └── pix.js            # Geração de código Pix (Padrão EMV)
│   └── locales/              # Internacionalização (pt-BR, en-US)
├── register-example.js       # Template para registro de comandos
├── wrangler.toml             # Configuração do Cloudflare Workers
├── package.json              # Dependências do projeto
├── LICENSE                   # Licença MIT
└── README.md                 # Este arquivo
```

---

## 🤝 Como Contribuir

Contribuições são muito bem-vindas! Veja como você pode ajudar:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### 📝 Padrão de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação de código
- `refactor:` Refatoração sem mudança de comportamento
- `test:` Adição ou correção de testes
- `chore:` Tarefas de manutenção

---

## 📚 Recursos Úteis

- [Documentação do Discord Interactions](https://discord.com/developers/docs/interactions/overview)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Firebase Firestore Lite](https://firebase.google.com/docs/firestore)
- [Padrão PIX EMV](https://www.bcb.gov.br/estabilidadefinanceira/pix)

---

## 🚀 Roadmap (Futuro do Projeto)

Estamos constantemente trabalhando para melhorar o Brasa Bot. Aqui estão algumas funcionalidades planejadas:

### 🌍 Internacionalização (i18n)
- Suporte para múltiplos idiomas (Inglês, Espanhol, Português)
- Detecção automática do locale do servidor Discord
- Sistema de tradução dinâmica para comandos e mensagens
- Contribuições da comunidade para novos idiomas

### 📊 Web Dashboard
- Integração com Next.js para painel administrativo web
- Visualização gráfica dos eventos em tempo real
- Gestão de caixa com relatórios financeiros detalhados
- Gráficos de participação e histórico de pagamentos
- Exportação de dados em CSV/Excel

### 🎯 Novas Funcionalidades Sociais
- **Sistema de Enquetes:** Votação para escolher o prato principal do churrasco
- **Integração com Spotify:** Criação colaborativa de playlist para o evento
- **Lembretes Automáticos:** Notificações 24h antes do evento
- **Galeria de Fotos:** Upload e compartilhamento de fotos do evento
- **Sistema de Avaliação:** Feedback pós-evento para melhorias

### 🔧 Melhorias Técnicas
- Migração para TypeScript para maior segurança de tipos
- Testes automatizados (Jest + Vitest)
- CI/CD com GitHub Actions
- Monitoramento com Sentry e Analytics
- Cache inteligente para reduzir chamadas ao Firebase

**Quer contribuir com alguma dessas features?** Abra uma issue ou PR! 🚀

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**Feito com ❤️ e muito 🔥 por [Bryan Walace](https://github.com/BryanWalace)**

Se este projeto te ajudou, considere dar uma ⭐ no repositório!

</div>