# 🔥 Brasa Bot

**O gerenciador definitivo de churrascos** - Organize, convide e gerencie eventos de churrasco com integração Discord e pagamentos via PIX.

---

## 📋 Sobre o Projeto

Brasa Bot é uma plataforma completa para organização de churrascos, combinando:
- 🎯 **Interface Web moderna** com Next.js 14
- 🤖 **Bot Discord integrado** para notificações e comandos
- 💰 **Sistema de pagamentos PIX** automatizado
- 📊 **Churrascômetro** para cálculo de quantidades

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **CSS Modules** (Design system customizado)

### Backend & Infraestrutura
- **Cloudflare Workers** (Discord OAuth Bridge + API)
- **Firebase Authentication** (Email/Senha + Custom Tokens)
- **Firebase Firestore** (Banco de dados NoSQL)
- **Discord.js** (Bot commands)

### Autenticação
- Discord OAuth 2.0 (via Worker)
- Firebase Email/Password
- Custom Token Bridge (Worker → Firebase)

---

## ✅ Funcionalidades Implementadas

### Autenticação
- [x] Login Social com Discord (OAuth via Cloudflare Worker)
- [x] Login/Cadastro com Email & Senha
- [x] Persistência de sessão com Firebase Auth
- [x] Atualização de perfil (nome e avatar do Discord)
- [x] Proteção de rotas privadas
- [x] Sistema de logout

### Dashboard
- [x] Listagem de eventos públicos
- [x] Listagem de eventos privados (usuário logado)
- [x] Ordenação por data
- [x] Cards interativos com informações do evento
- [x] Navbar responsiva com dropdown de usuário
- [x] Hero section com CTA dinâmico

### Infraestrutura
- [x] Cloudflare Worker para OAuth
- [x] Custom Token generation (Firebase Admin)
- [x] Firestore security rules (público/privado)
- [x] Tratamento de erros em português

---

## 🚧 Roadmap / Próximas Implementações

### Eventos
- [ ] Página de criação de evento (`/eventos/criar`)
- [ ] Edição de eventos existentes
- [ ] Exclusão de eventos
- [ ] Upload de imagens do evento
- [ ] Sistema de categorias/tags

### Churrascômetro
- [ ] Calculadora de carne por pessoa
- [ ] Calculadora de bebidas
- [ ] Lista de compras gerada automaticamente
- [ ] Sugestão de preços por região

### Sistema de Convidados
- [ ] Envio de convites (Discord + Email)
- [ ] RSVP (Confirmação de presença)
- [ ] Lista de participantes
- [ ] Sistema de "Trazer acompanhante"
- [ ] Lembretes automáticos

### Pagamentos
- [ ] Integração com API PIX
- [ ] Geração de QR Code
- [ ] Divisão de custos automática
- [ ] Rastreamento de pagamentos
- [ ] Relatório financeiro

### Discord Bot
- [ ] Comando `/criar-churrasco`
- [ ] Comando `/listar-eventos`
- [ ] Comando `/confirmar-presenca`
- [ ] Notificações de novos eventos
- [ ] Lembretes de pagamento
- [ ] Sistema de enquetes para escolher data/local

### Melhorias UX/UI
- [ ] Dark mode / Light mode toggle
- [ ] Animações e transições
- [ ] PWA (Progressive Web App)
- [ ] Sistema de notificações em tempo real
- [ ] Busca e filtros de eventos

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 18+ instalado
- Conta Firebase (Authentication + Firestore)
- Conta Cloudflare (para Workers)
- Aplicação Discord (para OAuth)

### 1. Clone o repositório

```bash
git clone https://github.com/BryanWalace/brasa-bot.git
cd brasa-bot
```

### 2. Configure as variáveis de ambiente

#### **Frontend (`web/.env.local`)**
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Worker URL (produção)
NEXT_PUBLIC_WORKER_URL=https://your-worker.workers.dev
```

#### **Wrangler Secrets (Cloudflare Worker)**
```bash
# Discord OAuth
npx wrangler secret put DISCORD_CLIENT_ID
npx wrangler secret put DISCORD_CLIENT_SECRET

# Firebase Admin (para Custom Tokens)
npx wrangler secret put FIREBASE_CLIENT_EMAIL
npx wrangler secret put FIREBASE_PRIVATE_KEY
```

### 3. Instale as dependências

```bash
# Frontend
cd web
npm install

# Worker (raiz do projeto)
cd ..
npm install
```

### 4. Execute em desenvolvimento

#### **Terminal 1: Frontend**
```bash
cd web
npm run dev
# http://localhost:3000
```

#### **Terminal 2: Worker (opcional)**
```bash
npx wrangler dev --port 8787
# http://localhost:8787
```

### 5. Deploy

#### **Frontend (Vercel recomendado)**
```bash
cd web
npm run build
# Deploy via Vercel CLI ou GitHub integration
```

#### **Worker (Cloudflare)**
```bash
npx wrangler deploy
```

---

## 📁 Estrutura do Projeto

```
brasa-bot/
├── web/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js          # Home / Dashboard
│   │   │   ├── page.module.css
│   │   │   └── login/
│   │   │       ├── page.js      # Login/Signup
│   │   │       └── login.module.css
│   │   └── firebase/
│   │       └── client.js        # Firebase config
│   ├── .env.local               # Environment variables
│   └── package.json
│
├── src/                         # Cloudflare Worker
│   ├── index.js                 # Worker main file (OAuth bridge)
│   ├── commands/                # Discord bot commands
│   ├── core/                    # Core bot logic
│   ├── database/                # DB helpers
│   └── services/                # External services
│
├── wrangler.toml                # Worker configuration
├── package.json                 # Worker dependencies
├── .gitignore
└── README.md
```

---

## 🔐 Segurança

### Implementado
- ✅ Secrets gerenciados via Wrangler (não comitados)
- ✅ `.env.local` no `.gitignore`
- ✅ Firebase Security Rules (público/privado)
- ✅ Validação de Custom Tokens (RS256)
- ✅ CORS configurado no Worker
- ✅ Rate limiting no Worker

### Recomendações
- 🔒 Use Firebase Security Rules rigorosas em produção
- 🔒 Configure domínio customizado para o Worker
- 🔒 Ative 2FA em todas as contas (Firebase, Cloudflare, Discord)
- 🔒 Revise permissões da Service Account do Firebase

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

**Bryan Wallace**
- GitHub: [@BryanWalace](https://github.com/BryanWalace)

---

## 🙏 Agradecimentos

- Next.js Team pelo framework incrível
- Firebase pela auth simplificada
- Cloudflare pelo Workers gratuito
- Discord pela API robusta

---

**🔥 Feito com muito churrasco e código!**