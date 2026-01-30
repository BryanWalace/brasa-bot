/**
 * Gera uma barra de progresso visual usando emojis
 * @param {number} percentage - Porcentagem (0-100)
 * @param {number} length - Tamanho da barra (padrão: 5)
 * @returns {string} - Barra visual (ex: "🟦🟦🟦⬜⬜")
 */
export function generateProgressBar(percentage, length = 5) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '🟦'.repeat(filled) + '⬜'.repeat(empty);
}

/**
 * Calcula a porcentagem de votos
 * @param {number} votes - Número de votos da opção
 * @param {number} totalVotes - Total de votos
 * @returns {number} - Porcentagem arredondada
 */
export function calculatePercentage(votes, totalVotes) {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
}

/**
 * Formata os resultados da enquete para exibição
 * @param {object} poll - Dados da enquete
 * @param {object} t - Objeto de tradução
 * @returns {string} - Texto formatado com barras e porcentagens
 */
export function formatPollResults(poll, t) {
    const { options, votes } = poll;
    const totalVotes = votes.reduce((sum, v) => sum + v, 0);

    if (totalVotes === 0) {
        return options.map(opt => `⬜⬜⬜⬜⬜  0% ${opt}`).join('\n');
    }

    const results = options.map((option, index) => {
        const voteCount = votes[index];
        const percentage = calculatePercentage(voteCount, totalVotes);
        const bar = generateProgressBar(percentage);
        const voteText = voteCount === 1
            ? t.poll.votesCountSingular
            : t.poll.votesCount.replace('{count}', voteCount);

        return `${bar} ${percentage}% ${option} (${voteText})`;
    });

    return results.join('\n');
}

/**
 * Formata o total de votos
 * @param {number} totalVotes - Total de votos
 * @param {object} t - Objeto de tradução
 * @returns {string} - Texto formatado
 */
export function formatTotalVotes(totalVotes, t) {
    if (totalVotes === 0) {
        return t.poll.noVotes;
    }

    if (totalVotes === 1) {
        return t.poll.totalVotesSingular;
    }

    return t.poll.totalVotes.replace('{count}', totalVotes);
}
