import { InteractionType, InteractionResponseType } from 'discord-interactions';
import { verifyDiscordRequest } from './core/security.js';
import { createEvent, getEvent, updateAttendee, markAsPaid, saveMessageRef, cancelEvent, createPoll, getPoll, recordVote, savePollMessageRef } from './database/firebase.js';
import { generatePixCopyPaste } from './services/pix.js';
import { getTranslation, formatMoney, interpolate } from './locales/index.js';
import { generateProgressBar, calculatePercentage, formatPollResults, formatTotalVotes } from './utils/poll.js';
import * as jose from 'jose';

const ComponentType = { ACTION_ROW: 1, BUTTON: 2, STRING_SELECT: 3 };
const ButtonStyle = { PRIMARY: 1, SECONDARY: 2, SUCCESS: 3, DANGER: 4 };



const buildAttendeesList = (attendees, t) => {
    if (!attendees || attendees.length === 0) return t.event.noAttendees;
    return attendees.map(a => {
        const statusIcon = a.paid ? t.event.paid : t.event.pending;
        return `✅ <@${a.id}> — ${statusIcon}`;
    }).join('\n');
};

// --- CORS HELPERS ---

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
        }
    });
}

// --- MAIN ENTRY POINT ---

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders()
            });
        }

        // Route Auth requests (Discord OAuth)
        if (url.pathname.startsWith('/auth/')) {
            return handleAuth(request, env, url);
        }

        // Route API requests
        if (url.pathname.startsWith('/api/')) {
            return handleAPI(request, env, url);
        }

        // Route Discord interactions (default)
        return handleDiscord(request, env, ctx);
    },
};

// --- AUTH HANDLER (Discord OAuth) ---

async function handleAuth(request, env, url) {
    const { pathname } = url;

    // Rota 1: Iniciar OAuth - Redireciona para Discord
    if (pathname === '/auth/discord') {
        const clientId = env.DISCORD_CLIENT_ID;
        const redirectUri = `${url.origin}/auth/discord/callback`;

        const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
        discordAuthUrl.searchParams.set('client_id', clientId);
        discordAuthUrl.searchParams.set('redirect_uri', redirectUri);
        discordAuthUrl.searchParams.set('response_type', 'code');
        discordAuthUrl.searchParams.set('scope', 'identify email');

        return Response.redirect(discordAuthUrl.toString(), 302);
    }

    // Rota 2: Callback do Discord
    if (pathname === '/auth/discord/callback') {
        const code = url.searchParams.get('code');

        if (!code) {
            console.error('❌ Callback sem código');
            return new Response('Missing code parameter', { status: 400 });
        }

        console.log('🔵 Iniciando callback Discord OAuth');
        console.log('Code recebido:', code.substring(0, 20) + '...');

        try {
            // 1. Trocar código por access_token
            console.log('🔵 Etapa 1: Trocando código por token...');
            const tokenUrl = 'https://discord.com/api/oauth2/token';
            const redirectUri = `${url.origin}/auth/discord/callback`;

            console.log('Redirect URI:', redirectUri);
            console.log('Client ID existe?', !!env.DISCORD_CLIENT_ID);
            console.log('Client Secret existe?', !!env.DISCORD_CLIENT_SECRET);

            const tokenResponse = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: env.DISCORD_CLIENT_ID,
                    client_secret: env.DISCORD_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                }),
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.text();
                console.error('❌ Erro ao trocar código:', tokenResponse.status, errorData);
                throw new Error(`Discord token exchange failed: ${tokenResponse.status} - ${errorData}`);
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            console.log('✅ Access token obtido:', accessToken.substring(0, 20) + '...');

            // 2. Buscar dados do usuário no Discord
            console.log('🔵 Etapa 2: Buscando usuário no Discord...');
            const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!userResponse.ok) {
                const errorData = await userResponse.text();
                console.error('❌ Erro ao buscar usuário:', userResponse.status, errorData);
                throw new Error(`Discord user fetch failed: ${userResponse.status}`);
            }

            const discordUser = await userResponse.json();
            console.log('✅ Usuário Discord:', discordUser.username, discordUser.id);

            // 3. Criar Firebase Custom Token
            console.log('🔵 Etapa 3: Gerando Custom Token...');
            console.log('Firebase Client Email existe?', !!env.FIREBASE_CLIENT_EMAIL);
            console.log('Firebase Private Key existe?', !!env.FIREBASE_PRIVATE_KEY);
            console.log('Firebase Private Key length:', env.FIREBASE_PRIVATE_KEY?.length || 0);

            const firebaseToken = await mintFirebaseToken(env, {
                uid: discordUser.id,
                email: discordUser.email,
                displayName: discordUser.username,
                photoURL: discordUser.avatar
                    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                    : null,
            });

            console.log('✅ Firebase Custom Token gerado:', firebaseToken.substring(0, 30) + '...');

            // 4. Redirecionar para o frontend com o token
            const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
            const redirectUrl = `${frontendUrl}/login?token=${firebaseToken}`;

            console.log('✅ Redirecionando para:', redirectUrl);
            return Response.redirect(redirectUrl, 302);

        } catch (error) {
            console.error('❌ ERRO NO CALLBACK:', error);
            console.error('Stack trace:', error.stack);

            const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
            const errorMessage = error.message || 'Unknown error';

            return Response.redirect(
                `${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`,
                302
            );
        }
    }

    return new Response('Not found', { status: 404 });
}

// Função para criar Firebase Custom Token
async function mintFirebaseToken(env, user) {
    const serviceAccountEmail = env.FIREBASE_CLIENT_EMAIL;
    let privateKeyPem = env.FIREBASE_PRIVATE_KEY;

    // CRÍTICO: Substituir literais \n por quebras de linha reais
    // Secrets do Wrangler às vezes salvam como string literal
    if (privateKeyPem.includes('\\n')) {
        privateKeyPem = privateKeyPem.replace(/\\n/g, '\n');
    }

    // Preparar claims do JWT
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: serviceAccountEmail,
        sub: serviceAccountEmail,
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        iat: now,
        exp: now + 3600, // 1 hora
        uid: user.uid,
        claims: {
            email: user.email,
            name: user.displayName,
            picture: user.photoURL,
        },
    };

    try {
        // Importar chave privada
        const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');

        // Assinar JWT
        const token = await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
            .setIssuedAt(now)
            .setExpirationTime(now + 3600)
            .sign(privateKey);

        return token;
    } catch (error) {
        console.error('Erro ao criar Firebase Custom Token:', error);
        throw new Error('Failed to mint Firebase token');
    }
}

// --- API HANDLER ---

async function handleAPI(request, env, url) {
    // Only GET method allowed for now
    if (request.method !== 'GET') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Route: GET /api/event?id=xxx
    if (url.pathname === '/api/event') {
        const eventId = url.searchParams.get('id');

        if (!eventId) {
            return jsonResponse({ error: 'Missing id parameter' }, 400);
        }

        const eventData = await getEvent(env, eventId);

        if (!eventData) {
            return jsonResponse({ error: 'Event not found', id: eventId }, 404);
        }

        // Calculate stats
        const attendees = eventData.attendees || [];
        const totalConfirmed = attendees.length;
        const totalPaid = attendees.filter(a => a.paid).length;
        const totalCollected = totalPaid * (eventData.amount || 0);

        // Return sanitized public data
        return jsonResponse({
            id: eventId,
            type: 'event',
            title: eventData.title,
            date: eventData.date,
            amount: eventData.amount || 0,
            organizer: {
                id: eventData.organizer_id,
                name: eventData.organizer_name
            },
            attendees: attendees.map(a => ({
                id: a.id,
                name: a.name,
                paid: a.paid || false
            })),
            stats: {
                total_confirmed: totalConfirmed,
                total_paid: totalPaid,
                total_collected: totalCollected
            },
            status: eventData.status || 'active',
            created_at: eventData.created_at
        });
    }

    // Route: GET /api/poll?id=xxx (similar structure)
    if (url.pathname === '/api/poll') {
        const pollId = url.searchParams.get('id');

        if (!pollId) {
            return jsonResponse({ error: 'Missing id parameter' }, 400);
        }

        const pollData = await getPoll(env, pollId);

        if (!pollData) {
            return jsonResponse({ error: 'Poll not found', id: pollId }, 404);
        }

        const totalVotes = pollData.votes.reduce((sum, v) => sum + v, 0);

        return jsonResponse({
            id: pollId,
            type: 'poll',
            question: pollData.question,
            options: pollData.options,
            votes: pollData.votes,
            total_votes: totalVotes,
            created_by: {
                id: pollData.created_by,
                name: pollData.creator_name
            },
            created_at: pollData.created_at
        });
    }

    // Unknown API route
    return jsonResponse({ error: 'API endpoint not found' }, 404);
}

// --- DISCORD HANDLER ---

async function handleDiscord(request, env, ctx) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const { isValid, interaction } = await verifyDiscordRequest(request, env);
    if (!isValid) {
        return new Response('Bad request signature', { status: 401 });
    }

    if (interaction.type === InteractionType.PING) {
        return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        const { name } = interaction.data;
        if (name === 'brasa') {
            ctx.waitUntil(handleCommand(interaction, env));
            return new Response(JSON.stringify({ type: 5 }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
        ctx.waitUntil(handleComponent(interaction, env));
        return new Response(JSON.stringify({ type: 6 }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response('Not found', { status: 404 });
}


// --- HANDLER DE COMANDOS ---
async function handleCommand(interaction, env) {
    const { options } = interaction.data;
    const args = options && options[0].options ? options[0].options : [];
    const subCommand = options ? options[0].name : null;

    // Detectar locale e carregar traduções
    const t = getTranslation(interaction.locale);

    try {
        if (subCommand === 'novo') {
            const getArg = (n) => args.find(a => a.name === n)?.value;
            const title = getArg('titulo');
            const date = getArg('data');
            const amount = getArg('valor') || 0; // Se não informado, será 0 (grátis)
            const pixKey = getArg('chave_pix'); // Pode ser undefined

            // Criar evento no Firestore
            const eventId = await createEvent(env, {
                guild_id: interaction.guild_id,
                organizer_id: interaction.member.user.id,
                organizer_name: interaction.member.user.username,
                title,
                date,
                amount,
                pix_key: pixKey || null // Salvar como null se não fornecido
            });

            // Construir componentes (botões)
            const components = [
                { type: ComponentType.BUTTON, style: ButtonStyle.SUCCESS, label: t.buttons.join, custom_id: `join_${eventId}` },
                { type: ComponentType.BUTTON, style: ButtonStyle.DANGER, label: t.buttons.leave, custom_id: `leave_${eventId}` }
            ];

            // Adicionar botão "Pagar" SOMENTE se tiver PIX e valor > 0
            if (pixKey && amount > 0) {
                components.push({
                    type: ComponentType.BUTTON,
                    style: ButtonStyle.PRIMARY,
                    label: t.buttons.pay,
                    custom_id: `pay_${eventId}`,
                    emoji: { name: "💸" }
                });
            }

            // Botão de gerenciar sempre presente
            components.push({
                type: ComponentType.BUTTON,
                style: ButtonStyle.SECONDARY,
                label: t.buttons.manage,
                custom_id: `admin_${eventId}`,
                emoji: { name: "👑" }
            });

            // Construir payload da resposta
            const payload = {
                embeds: [{
                    title: `🔥 ${title}`,
                    description: `${t.event.description}\n\n📅 **${t.event.when}:** ${date}\n💰 **${t.event.amount}:** ${formatMoney(amount, t)}\n👑 **${t.event.organizer}:** <@${interaction.member.user.id}>\n\n**${t.event.confirmed}:**\n${t.event.noAttendees}`,
                    color: 0xFF5722,
                    footer: { text: `ID: ${eventId}` }
                }],
                components: [{
                    type: ComponentType.ACTION_ROW,
                    components: components
                }]
            };

            await updateOriginalInteraction(interaction.token, payload, env.DISCORD_APP_ID);

            // Salvar referência da mensagem para edições futuras
            const messageData = await getOriginalMessage(interaction.token, env.DISCORD_APP_ID);
            if (messageData && messageData.id) {
                await saveMessageRef(env, eventId, messageData.channel_id, messageData.id);
            }
        }

        if (subCommand === 'enquete') {
            const getArg = (n) => args.find(a => a.name === n)?.value;
            const question = getArg('pergunta');
            const optionsStr = getArg('opcoes');

            // Separar opções e limpar espaços
            const options = optionsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

            // Validar quantidade de opções
            if (options.length < 2) {
                await updateOriginalInteraction(interaction.token, { content: t.poll.minOptions }, env.DISCORD_APP_ID);
                return;
            }

            if (options.length > 5) {
                await updateOriginalInteraction(interaction.token, { content: t.poll.maxOptions }, env.DISCORD_APP_ID);
                return;
            }

            // Criar enquete no Firestore
            const pollId = await createPoll(env, {
                question,
                options,
                votes: new Array(options.length).fill(0), // Array de zeros
                created_by: interaction.member.user.id,
                creator_name: interaction.member.user.username,
                guild_id: interaction.guild_id
            });

            // Construir botões para cada opção
            const buttons = options.map((option, index) => ({
                type: ComponentType.BUTTON,
                style: ButtonStyle.PRIMARY,
                label: option,
                custom_id: `poll_${pollId}_${index}`
            }));

            // Criar embed inicial
            const pollEmbed = {
                title: `📊 ${question}`,
                description: formatPollResults({ options, votes: new Array(options.length).fill(0) }, t) + '\n\n' + t.poll.noVotes,
                color: 0x5865F2,
                footer: { text: `ID: ${pollId}` }
            };

            const payload = {
                embeds: [pollEmbed],
                components: [{
                    type: ComponentType.ACTION_ROW,
                    components: buttons
                }]
            };

            await updateOriginalInteraction(interaction.token, payload, env.DISCORD_APP_ID);

            // Salvar referência da mensagem
            const messageData = await getOriginalMessage(interaction.token, env.DISCORD_APP_ID);
            if (messageData && messageData.id) {
                await savePollMessageRef(env, pollId, messageData.channel_id, messageData.id);
            }
        }
    } catch (error) {
        console.error(error);
        await updateOriginalInteraction(interaction.token, { content: `${t.errors.generic}: ${error.message}` }, env.DISCORD_APP_ID);
    }
}

// --- HANDLER DE COMPONENTES ---
async function handleComponent(interaction, env) {
    const customId = interaction.data.custom_id;
    const [action, eventId] = customId.split('_');
    const user = interaction.member.user;

    // Detectar locale e carregar traduções
    const t = getTranslation(interaction.locale);

    try {
        if (action === 'admin') {
            const eventData = await getEvent(env, eventId);

            if (eventData.organizer_id !== user.id) {
                await sendFollowup(interaction.token, { content: t.errors.onlyOrganizerCanManage, flags: 64 }, env.DISCORD_APP_ID);
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
                        placeholder: t.admin.confirmPaymentPlaceholder,
                        options: attendees.map(a => ({
                            label: a.name, value: a.id, description: a.paid ? t.admin.alreadyPaid : t.admin.pending, emoji: { name: a.paid ? "✅" : "⏳" }
                        }))
                    }]
                });
            }

            components.push({
                type: ComponentType.ACTION_ROW,
                components: [{
                    type: ComponentType.BUTTON,
                    style: ButtonStyle.DANGER,
                    label: t.buttons.cancelEvent,
                    custom_id: `delete_${eventId}`,
                    emoji: { name: "🗑️" }
                }]
            });

            await sendFollowup(interaction.token, {
                content: `${t.admin.panel}\n${t.admin.instructions}`,
                flags: 64,
                components: components
            }, env.DISCORD_APP_ID);
            return;
        }

        if (action === 'delete') {
            const cancelledEvent = await cancelEvent(env, eventId);

            if (cancelledEvent.channel_id && cancelledEvent.message_id) {
                const embedBase = {
                    title: `${t.event.cancelled}: ${cancelledEvent.title}`,
                    description: `${t.event.cancelledDescription}\n\n**${t.event.originalDate}:** ${cancelledEvent.date}\n**${t.event.totalConfirmed}:** ${cancelledEvent.attendees ? cancelledEvent.attendees.length : 0}`,
                    color: 0x000000,
                    footer: { text: `${t.event.eventEnded} • ID: ${eventId}` }
                };

                await editMessageWithBotToken(env, cancelledEvent.channel_id, cancelledEvent.message_id, {
                    embeds: [embedBase],
                    components: []
                });
            }

            await sendFollowup(interaction.token, { content: t.admin.eventCancelled, flags: 64 }, env.DISCORD_APP_ID);
            return;
        }


        if (action === 'confirm') {
            const userIdToConfirm = interaction.data.values[0];
            const updatedEvent = await markAsPaid(env, eventId, userIdToConfirm);

            if (updatedEvent.channel_id && updatedEvent.message_id) {
                const embedBase = {
                    title: `🔥 ${updatedEvent.title}`,
                    description: `${t.event.description}\n\n📅 **${t.event.when}:** ${updatedEvent.date}\n💰 **${t.event.amount}:** ${formatMoney(updatedEvent.amount, t)}\n👑 **${t.event.organizer}:** <@${updatedEvent.organizer_id}>\n\n**${t.event.confirmed}:**\n${buildAttendeesList(updatedEvent.attendees, t)}`,
                    color: 0xFF5722,
                    footer: { text: `ID: ${eventId}` }
                };
                await editMessageWithBotToken(env, updatedEvent.channel_id, updatedEvent.message_id, { embeds: [embedBase] });
            }
            await sendFollowup(interaction.token, { content: t.admin.paymentConfirmed, flags: 64 }, env.DISCORD_APP_ID);
            return;
        }

        if (action === 'pay') {
            const eventData = await getEvent(env, eventId);
            if (eventData.status === 'cancelled') {
                await sendFollowup(interaction.token, { content: t.errors.eventCancelled, flags: 64 }, env.DISCORD_APP_ID);
                return;
            }

            if (!eventData || !eventData.pix_key) {
                await sendFollowup(interaction.token, { content: t.errors.pixKeyNotFound, flags: 64 }, env.DISCORD_APP_ID);
                return;
            }
            const pixCode = generatePixCopyPaste(eventData.pix_key, eventData.amount, eventData.title);
            await sendFollowup(interaction.token, {
                content: `${interpolate(t.pix.title, { title: eventData.title })}\n${interpolate(t.pix.value, { amount: formatMoney(eventData.amount, t) })}\n\n${t.pix.instructions}`,
                embeds: [{ description: `\`\`\`${pixCode}\`\`\``, color: 0x2ECC71 }],
                flags: 64
            }, env.DISCORD_APP_ID);
            return;
        }

        if (action === 'poll') {
            const pollId = customId.split('_')[1];
            const optionIndex = parseInt(customId.split('_')[2]);

            const updatedPoll = await recordVote(env, pollId, user.id, optionIndex);

            if (!updatedPoll) {
                // Usuário já votou
                await sendFollowup(interaction.token, { content: t.poll.alreadyVoted, flags: 64 }, env.DISCORD_APP_ID);
                return;
            }

            // Atualizar embed com novos resultados
            if (updatedPoll.channel_id && updatedPoll.message_id) {
                const totalVotes = updatedPoll.votes.reduce((sum, v) => sum + v, 0);

                const updatedEmbed = {
                    title: `📊 ${updatedPoll.question}`,
                    description: formatPollResults(updatedPoll, t) + '\n\n' + formatTotalVotes(totalVotes, t),
                    color: 0x5865F2,
                    footer: { text: `ID: ${pollId}` }
                };

                await editMessageWithBotToken(env, updatedPoll.channel_id, updatedPoll.message_id, {
                    embeds: [updatedEmbed]
                });
            }

            // Feedback efêmero para o usuário
            await sendFollowup(interaction.token, { content: t.poll.voteRecorded, flags: 64 }, env.DISCORD_APP_ID);
            return;
        }

        const status = action === 'join' ? 'join' : 'leave';
        const updatedEvent = await updateAttendee(env, eventId, user, status);

        if (updatedEvent) {
            const newEmbed = interaction.message.embeds[0];
            const parts = newEmbed.description.split(`**${t.event.confirmed}:**`);
            const baseDesc = parts[0];
            newEmbed.description = `${baseDesc}**${t.event.confirmed}:**\n${buildAttendeesList(updatedEvent.attendees, t)}`;

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