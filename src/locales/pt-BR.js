export default {
    common: {
        free: 'Grátis',
        currency: 'R$',
    },

    event: {
        created: 'Evento criado com sucesso!',
        description: 'Um novo evento está na brasa! Confirme sua presença abaixo.',
        when: 'Quando',
        amount: 'Valor',
        organizer: 'Organizador',
        confirmed: 'Confirmados',
        noAttendees: 'Ninguém confirmou ainda.',
        paid: '💲 **PAGO**',
        pending: '⏳ Pendente',
        cancelled: '🚫 CANCELADO',
        cancelledDescription: '~~Este evento foi cancelado ou encerrado pelo organizador.~~',
        originalDate: 'Data Original',
        totalConfirmed: 'Total de Confirmados',
        eventEnded: 'Evento Encerrado',
    },

    buttons: {
        join: 'Vou',
        leave: 'Não vou',
        pay: 'Pagar',
        manage: 'Gerenciar',
        cancelEvent: 'Cancelar/Encerrar Evento',
    },

    errors: {
        generic: '❌ Erro',
        onlyOrganizerCanManage: '❌ Apenas o organizador pode gerenciar.',
        pixKeyNotFound: '❌ Chave PIX não encontrada.',
        eventCancelled: '❌ Este evento foi cancelado.',
    },

    pix: {
        title: '💰 **Pagamento para: {title}**',
        value: 'Valor: {amount}',
        instructions: 'Copie o código abaixo e cole no seu banco:',
    },

    admin: {
        panel: '⚙️ **Painel de Gerenciamento**',
        instructions: 'Use o menu para confirmar pagamentos ou o botão para cancelar o evento.',
        confirmPaymentPlaceholder: 'Confirmar pagamento de...',
        paymentConfirmed: '✅ Pagamento confirmado!',
        eventCancelled: '✅ O evento foi cancelado e os botões removidos.',
        alreadyPaid: 'Já Pago',
        pending: 'Pendente',
    },

    poll: {
        created: '📊 Enquete criada!',
        question: 'Pergunta',
        totalVotes: 'Total: {count} votos',
        totalVotesSingular: 'Total: 1 voto',
        noVotes: 'Nenhum voto ainda',
        alreadyVoted: '⚠️ Você já votou nesta enquete!',
        voteRecorded: '✅ Voto registrado!',
        minOptions: '❌ É necessário pelo menos 2 opções.',
        maxOptions: '❌ Máximo de 5 opções permitidas.',
        votesCount: '{count} votos',
        votesCountSingular: '1 voto',
    },
};
