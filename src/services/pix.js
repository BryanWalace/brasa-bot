/*
  Gera o payload "Copia e Cola" do PIX (Padrão EMV QRCPS-MPM).
*/

function formatField(id, value) {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
}

// Cálculo do CRC16 (Validação de segurança do banco)
function crc16(payload) {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ polynomial;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixCopyPaste(pixKey, amount = 0, description = '', merchantName = 'Brasa Bot', merchantCity = 'BRASIL') {
    const key = pixKey.replace(/\s/g, ''); // Tira espaços

    const amountStr = amount > 0 ? amount.toFixed(2) : '';

    let payload =
        formatField('00', '01') +                           // Payload Format Indicator
        formatField('01', '12') +                           // Point of Initiation Method (12 = Dinâmico)
        formatField('26',                                   // Merchant Account Information
            formatField('00', 'BR.GOV.BCB.PIX') +             // GUI
            formatField('01', key)                            // Chave PIX
        ) +
        formatField('52', '0000') +                         // Merchant Category Code
        formatField('53', '986') +                          // Moeda (986 = BRL)
        (amountStr ? formatField('54', amountStr) : '') +   // Valor (Se tiver)
        formatField('58', 'BR') +                           // País
        formatField('59', merchantName) +                   // Nome do Recebedor (Não precisa ser exato, mas precisa ter)
        formatField('60', merchantCity) +                   // Cidade
        formatField('62',                                   // Campo Adicional (Descrição)
            formatField('05', description || 'CHURRAS')       // Reference Label
        ) +
        '6304';

    payload += crc16(payload);

    return payload;
}