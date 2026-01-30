import ptBR from './pt-BR.js';
import enUS from './en-US.js';

/**
 * Retorna o objeto de tradução apropriado baseado no locale.
 * @param {string} locale - O locale da interação (ex: "en-US", "pt-BR")
 * @returns {object} - O objeto de tradução correspondente
 */
export function getTranslation(locale) {
    // Se o locale começa com 'en', retorna inglês
    if (locale && locale.toLowerCase().startsWith('en')) {
        return enUS;
    }

    // Default: português brasileiro
    return ptBR;
}

/**
 * Formata valores monetários de acordo com o locale
 * @param {number} val - Valor a ser formatado
 * @param {object} t - Objeto de tradução
 * @returns {string} - Valor formatado
 */
export function formatMoney(val, t) {
    if (!val || val === 0) return t.common.free;

    // Para pt-BR, usa vírgula como separador decimal
    if (t === ptBR) {
        return `${t.common.currency} ${val.toFixed(2).replace('.', ',')}`;
    }

    // Para en-US, usa ponto como separador decimal
    return `${t.common.currency}${val.toFixed(2)}`;
}

/**
 * Substitui placeholders em strings de tradução
 * @param {string} str - String com placeholders
 * @param {object} params - Objeto com valores para substituir
 * @returns {string} - String com valores substituídos
 */
export function interpolate(str, params = {}) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
    });
}
