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
                    { name: 'titulo', description: 'Nome do evento', type: 3, required: true },
                    { name: 'data', description: 'Quando vai ser?', type: 3, required: true },
                    { name: 'valor', description: 'Valor por pessoa', type: 10, required: false },
                    { name: 'chave_pix', description: 'Sua chave PIX', type: 3, required: false }
                ]
            },
            {
                name: 'teste',
                description: 'Verifica conexão',
                type: 1
            }
        ]
    }
];

async function registerGlobalCommands() {
    const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;

    console.log(`Registrando comandos globais em: ${url}`);

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${TOKEN}`,
        },
        method: 'PUT',
        body: JSON.stringify(commands),
    });

    if (response.ok) {
        console.log('✅ SUCESSO! Comandos Globais registrados.');
        console.log('⏳ AVISO: Pode levar até 1 hora para aparecer em novos servidores.');
    } else {
        console.error('❌ Erro ao registrar:');
        const text = await response.text();
        console.error(text);
    }
}

registerGlobalCommands();