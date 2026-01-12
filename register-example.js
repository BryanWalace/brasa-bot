const TOKEN = 'SEU_TOKEN_DO_BOT_AQUI';
const APP_ID = 'SEU_APP_ID_AQUI';

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

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${TOKEN}`,
        },
        method: 'PUT',
        body: JSON.stringify(commands),
    });

    if (response.ok) {
        console.log('✅ Comandos registrados!');
    } else {
        console.error('❌ Erro:', await response.text());
    }
}

registerGlobalCommands();