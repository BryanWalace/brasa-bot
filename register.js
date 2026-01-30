require('dotenv').config({ path: 'web/.env.local' }); // Tenta carregar do .env.local se existir

const TOKEN = process.env.DISCORD_TOKEN;
const APP_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !APP_ID) {
    console.error('❌ Erro: DISCORD_TOKEN e DISCORD_CLIENT_ID devem estar definidos nas variáveis de ambiente.');
    process.exit(1);
}

const commands = [
    {
        name: 'brasa',
        description: '🔥 Gerencie seus churrascos e eventos',
        options: [
            {
                name: 'novo',
                description: 'Cria um novo evento com lista de presença e PIX',
                type: 1,
                options: [
                    {
                        name: 'titulo',
                        description: 'Nome do evento (Ex: Churras do Fim de Ano)',
                        type: 3,
                        required: true
                    },
                    {
                        name: 'data',
                        description: 'Quando vai ser? (Ex: 20/12 às 14h)',
                        type: 3,
                        required: true
                    },
                    {
                        name: 'valor',
                        description: 'Valor por pessoa (Ex: 35.50). Use ponto, não vírgula.',
                        type: 10,
                        required: false
                    },
                    {
                        name: 'chave_pix',
                        description: 'Sua chave PIX (CPF, Email, Celular ou Aleatória)',
                        type: 3,
                        required: false
                    }
                ]
            },
            {
                name: 'teste',
                description: 'Testa conexão',
                type: 1
            }
        ]
    }
];

const GUILD_ID = '695719584270909450';

async function registerCommands() {
    //const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;
    const url = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${TOKEN}`,
        },
        method: 'PUT',
        body: JSON.stringify(commands),
    });

    if (response.ok) {
        console.log('✅ Comandos registrados com sucesso!');
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.error('❌ Erro ao registrar comandos:');
        const text = await response.text();
        console.error(text);
    }
}

registerCommands();