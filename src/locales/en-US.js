export default {
    common: {
        free: 'Free',
        currency: '$',
    },

    event: {
        created: 'Event created successfully!',
        description: 'A new event is on fire! Confirm your attendance below.',
        when: 'When',
        amount: 'Amount',
        organizer: 'Organizer',
        confirmed: 'Confirmed',
        noAttendees: 'No one confirmed yet.',
        paid: '💲 **PAID**',
        pending: '⏳ Pending',
        cancelled: '🚫 CANCELLED',
        cancelledDescription: '~~This event was cancelled or ended by the organizer.~~',
        originalDate: 'Original Date',
        totalConfirmed: 'Total Confirmed',
        eventEnded: 'Event Ended',
    },

    buttons: {
        join: "I'm going",
        leave: "Can't make it",
        pay: 'Pay',
        manage: 'Manage',
        cancelEvent: 'Cancel/End Event',
    },

    errors: {
        generic: '❌ Error',
        onlyOrganizerCanManage: '❌ Only the organizer can manage.',
        pixKeyNotFound: '❌ PIX key not found.',
        eventCancelled: '❌ This event has been cancelled.',
    },

    pix: {
        title: '💰 **Payment for: {title}**',
        value: 'Amount: {amount}',
        instructions: 'Copy the code below and paste it in your bank app:',
    },

    admin: {
        panel: '⚙️ **Management Panel**',
        instructions: 'Use the menu to confirm payments or the button to cancel the event.',
        confirmPaymentPlaceholder: 'Confirm payment from...',
        paymentConfirmed: '✅ Payment confirmed!',
        eventCancelled: '✅ The event was cancelled and buttons removed.',
        alreadyPaid: 'Already Paid',
        pending: 'Pending',
    },

    poll: {
        created: '📊 Poll created!',
        question: 'Question',
        totalVotes: 'Total: {count} votes',
        totalVotesSingular: 'Total: 1 vote',
        noVotes: 'No votes yet',
        alreadyVoted: '⚠️ You already voted in this poll!',
        voteRecorded: '✅ Vote recorded!',
        minOptions: '❌ At least 2 options are required.',
        maxOptions: '❌ Maximum of 5 options allowed.',
        votesCount: '{count} votes',
        votesCountSingular: '1 vote',
    },
};
