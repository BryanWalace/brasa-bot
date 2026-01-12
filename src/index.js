import { InteractionType, InteractionResponseType } from 'discord-interactions';
import { verifyDiscordRequest } from './core/security.js';
import { createEvent, getEvent, updateAttendee, markAsPaid, saveMessageRef, cancelEvent } from './database/firebase.js';
import { generatePixCopyPaste } from './services/pix.js';

const ComponentType = { ACTION_ROW: 1, BUTTON: 2, STRING_SELECT: 3 };
const ButtonStyle = { PRIMARY: 1, SECONDARY: 2, SUCCESS: 3, DANGER: 4 };

const formatMoney = (val) => val ? `R$ ${val.toFixed(2).replace('.', ',')}` : 'Grátis';

const buildAttendeesList = (attendees) => {
    if (!attendees || attendees.length === 0) return "Ninguém confirmou ainda.";
    return attendees.map(a => {
        const statusIcon = a.paid ? "💲 **PAGO**" : "⏳ Pendente";
        return `✅ <@${a.id}> — ${statusIcon}`;
    }).join('\n');
};

export default {
    async fetch(request, env, ctx) {
        if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

        const { isValid, interaction } = await verifyDiscordRequest(request, env);
        if (!isValid) return new Response('Bad request signature', { status: 401 });

        if (interaction.type === InteractionType.PING) {
            return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), { headers: { 'Content-Type': 'application/json' } });
        }

        if (interaction.type === InteractionType.APPLICATION_COMMAND) {
            const { name } = interaction.data;
            if (name === 'brasa') {
                ctx.waitUntil(handleCommand(interaction, env));
                return new Response(JSON.stringify({ type: 5 }), { headers: { 'Content-Type': 'application/json' } });
            }
        }

        if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
            ctx.waitUntil(handleComponent(interaction, env));
            return new Response(JSON.stringify({ type: 6 }), { headers: { 'Content-Type': 'application/json' } });
        }

        return new Response('Not found', { status: 404 });
    },
};

// --- HANDLER DE COMANDOS ---
async function handleCommand(interaction, env) {
    const { options } = interaction.data;
    const args = options && options[0].options ? options[0].options : [];
    const subCommand = options ? options[0].name : null;

    try {
        if (subCommand === 'novo') {
            const getArg = (n) => args.find(a => a.name === n)?.value;
            const title = getArg('titulo');
            const date = getArg('data');
            const amount = getArg('valor') || 0;
            const pixKey = getArg('chave_pix');

            const eventId = await createEvent(env, {
                guild_id: interaction.guild_id,
                organizer_id: interaction.member.user.id,
                organizer_name: interaction.member.user.username,
                title, date, amount, pix_key: pixKey
            });

            const payload = {
                embeds: [{
                    title: `🔥 ${title}`,
                    description: `Um novo evento está na brasa! Confirme sua presença abaixo.\n\n📅 **Quando:** ${date}\n💰 **Valor:** ${formatMoney(amount)}\n👑 **Organizador:** <@${interaction.member.user.id}>\n\n**Confirmados:**\nNinguém ainda.`,
                    color: 0xFF5722,
                    footer: { text: `ID: ${eventId}` }
                }],
                components: [
                    {
                        type: ComponentType.ACTION_ROW,
                        components: [
                            { type: ComponentType.BUTTON, style: ButtonStyle.SUCCESS, label: "Vou", custom_id: `join_${eventId}` },
                            { type: ComponentType.BUTTON, style: ButtonStyle.DANGER, label: "Não vou", custom_id: `leave_${eventId}` },
                            ...(pixKey && amount > 0 ? [{ type: ComponentType.BUTTON, style: ButtonStyle.PRIMARY, label: "Pagar", custom_id: `pay_${eventId}`, emoji: { name: "💸" } }] : []),
                            { type: ComponentType.BUTTON, style: ButtonStyle.SECONDARY, label: "Gerenciar", custom_id: `admin_${eventId}`, emoji: { name: "👑" } }
                        ]
                    }
                ]
            };

            await updateOriginalInteraction(interaction.token, payload, env.DISCORD_APP_ID);

            const messageData = await getOriginalMessage(interaction.token, env.DISCORD_APP_ID);
            if (messageData && messageData.id) {
                await saveMessageRef(env, eventId, messageData.channel_id, messageData.id);
            }
        }
    } catch (error) {
        console.error(error);
        await updateOriginalInteraction(interaction.token, { content: `❌ Erro: ${error.message}` }, env.DISCORD_APP_ID);
    }
}

// --- HANDLER DE COMPONENTES ---
async function handleComponent(interaction, env) {
    const customId = interaction.data.custom_id;
    const [action, eventId] = customId.split('_');
    const user = interaction.member.user;

    try {
        if (action === 'admin') {
            const eventData = await getEvent(env, eventId);

            if (eventData.organizer_id !== user.id) {
                await sendFollowup(interaction.token, { content: "❌ Apenas o organizador pode gerenciar.", flags: 64 }, env.DISCORD_APP_ID);
                return;
            }

            const attendees = eventData.attendees || [];

            const components = [];

            if (attendees.length > 0) {
                components.push({
                    type: ComponentType.ACTION_ROW,
                    components: [{
                        type: ComponentType.STRING_SELECT,
                        custom_id: `confirm_${eventId}`,
                        placeholder: "Confirmar pagamento de...",
                        options: attendees.map(a => ({
                            label: a.name, value: a.id, description: a.paid ? "Já Pago" : "Pendente", emoji: { name: a.paid ? "✅" : "⏳" }
                        }))
                    }]
                });
            }

            components.push({
                type: ComponentType.ACTION_ROW,
                components: [{
                    type: ComponentType.BUTTON,
                    style: ButtonStyle.DANGER,
                    label: "Cancelar/Encerrar Evento",
                    custom_id: `delete_${eventId}`,
                    emoji: { name: "🗑️" }
                }]
            });

            await sendFollowup(interaction.token, {
                content: "⚙️ **Painel de Gerenciamento**\nUse o menu para confirmar pagamentos ou o botão para cancelar o evento.",
                flags: 64,
                components: components
            }, env.DISCORD_APP_ID);
            return;
        }

        if (action === 'delete') {
            const cancelledEvent = await cancelEvent(env, eventId);

            if (cancelledEvent.channel_id && cancelledEvent.message_id) {
                const embedBase = {
                    title: `🚫 CANCELADO: ${cancelledEvent.title}`,
                    description: `~~Este evento foi cancelado ou encerrado pelo organizador.~~\n\n**Data Original:** ${cancelledEvent.date}\n**Total de Confirmados:** ${cancelledEvent.attendees ? cancelledEvent.attendees.length : 0}`,
                    color: 0x000000,
                    footer: { text: `Evento Encerrado • ID: ${eventId}` }
                };

                await editMessageWithBotToken(env, cancelledEvent.channel_id, cancelledEvent.message_id, {
                    embeds: [embedBase],
                    components: []
                });
            }

            await sendFollowup(interaction.token, { content: "✅ O evento foi cancelado e os botões removidos.", flags: 64 }, env.DISCORD_APP_ID);
            return;
        }


        if (action === 'confirm') {
            const userIdToConfirm = interaction.data.values[0];
            const updatedEvent = await markAsPaid(env, eventId, userIdToConfirm);

            if (updatedEvent.channel_id && updatedEvent.message_id) {
                const embedBase = {
                    title: `🔥 ${updatedEvent.title}`,
                    description: `Um novo evento está na brasa! Confirme sua presença abaixo.\n\n📅 **Quando:** ${updatedEvent.date}\n💰 **Valor:** ${formatMoney(updatedEvent.amount)}\n👑 **Organizador:** <@${updatedEvent.organizer_id}>\n\n**Confirmados:**\n${buildAttendeesList(updatedEvent.attendees)}`,
                    color: 0xFF5722,
                    footer: { text: `ID: ${eventId}` }
                };
                await editMessageWithBotToken(env, updatedEvent.channel_id, updatedEvent.message_id, { embeds: [embedBase] });
            }
            await sendFollowup(interaction.token, { content: `✅ Pagamento confirmado!`, flags: 64 }, env.DISCORD_APP_ID);
            return;
        }

        if (action === 'pay') {
            const eventData = await getEvent(env, eventId);
            if (eventData.status === 'cancelled') {
                await sendFollowup(interaction.token, { content: "❌ Este evento foi cancelado.", flags: 64 }, env.DISCORD_APP_ID);
                return;
            }

            if (!eventData || !eventData.pix_key) {
                await sendFollowup(interaction.token, { content: "❌ Chave PIX não encontrada.", flags: 64 }, env.DISCORD_APP_ID);
                return;
            }
            const pixCode = generatePixCopyPaste(eventData.pix_key, eventData.amount, eventData.title);
            await sendFollowup(interaction.token, {
                content: `💰 **Pagamento para: ${eventData.title}**\nValor: ${formatMoney(eventData.amount)}\n\nCopie o código abaixo e cole no seu banco:`,
                embeds: [{ description: `\`\`\`${pixCode}\`\`\``, color: 0x2ECC71 }],
                flags: 64
            }, env.DISCORD_APP_ID);
            return;
        }

        const status = action === 'join' ? 'join' : 'leave';
        const updatedEvent = await updateAttendee(env, eventId, user, status);

        if (updatedEvent) {
            const newEmbed = interaction.message.embeds[0];
            const parts = newEmbed.description.split('**Confirmados:**');
            const baseDesc = parts[0];
            newEmbed.description = `${baseDesc}**Confirmados:**\n${buildAttendeesList(updatedEvent.attendees)}`;

            await fetch(`https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${interaction.token}/messages/${interaction.message.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [newEmbed] })
            });
        }

    } catch (error) {
        console.error("Erro componente:", error);
    }
}

// --- FUNÇÕES AUXILIARES ---

async function updateOriginalInteraction(token, body, appId) {
    await fetch(`https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
}

async function getOriginalMessage(token, appId) {
    const res = await fetch(`https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) return await res.json();
    return null;
}

async function sendFollowup(token, body, appId) {
    await fetch(`https://discord.com/api/v10/webhooks/${appId}/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
}

async function editMessageWithBotToken(env, channelId, messageId, body) {
    if (!env.DISCORD_TOKEN) return;
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${env.DISCORD_TOKEN}`
        },
        body: JSON.stringify(body)
    });
}