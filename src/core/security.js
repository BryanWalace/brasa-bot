import { verifyKey } from 'discord-interactions';

/*
 * Verifica se a requisição veio realmente do Discord.
 */
export async function verifyDiscordRequest(request, env) {
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');

    // O Cloudflare consome o body ao ler
    const body = await request.text();

    if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY) {
        return { isValid: false };
    }

    const isValid = await verifyKey(
        body,
        signature,
        timestamp,
        env.DISCORD_PUBLIC_KEY
    );

    if (!isValid) {
        return { isValid: false };
    }

    return { isValid: true, interaction: JSON.parse(body) };
}