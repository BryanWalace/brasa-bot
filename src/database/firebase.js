import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore/lite';

let dbInstance = null;

export function getDb(env) {
    if (dbInstance) return dbInstance;

    const firebaseConfig = JSON.parse(env.FIREBASE_CONFIG);

    const app = initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);

    return dbInstance;
}

// 1. Função para testar se gravou (Ping no Banco)
export async function testDatabaseConnection(env) {
    try {
        const db = getDb(env);
        await addDoc(collection(db, "logs"), {
            message: "Brasa Bot conectado!",
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error("Erro no Firebase:", error);
        return false;
    }
}

// 2. Função para criar um evento
export async function createEvent(env, eventData) {
    const db = getDb(env);
    const docRef = await addDoc(collection(db, "events"), {
        ...eventData,
        created_at: new Date().toISOString(),
        attendees: [] // Começa com lista vazia
    });
    return docRef.id;
}

// 3. Função para buscar um evento
export async function getEvent(env, eventId) {
    const db = getDb(env);
    const docRef = doc(db, 'events', eventId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
        return snapshot.data();
    }
    return null;
}

// 4. Função para atualizar presença
export async function updateAttendee(env, eventId, user, status) {
    const db = getDb(env);
    const eventRef = doc(db, 'events', eventId);

    const snapshot = await getDoc(eventRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    let attendees = data.attendees || [];

    attendees = attendees.filter(a => a.id !== user.id);

    if (status === 'join') {
        attendees.push({
            id: user.id,
            name: user.username,
            joined_at: new Date().toISOString()
        });
    }

    await updateDoc(eventRef, { attendees });

    return { ...data, attendees };
}

// 5. Função para marcar presença como paga
export async function markAsPaid(env, eventId, userId) {
    const db = getDb(env);
    const eventRef = doc(db, 'events', eventId);

    const snapshot = await getDoc(eventRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    let attendees = data.attendees || [];

    const updatedAttendees = attendees.map(a => {
        if (a.id === userId) {
            return { ...a, paid: true };
        }
        return a;
    });

    await updateDoc(eventRef, { attendees: updatedAttendees });

    return { ...data, attendees: updatedAttendees };
}

// 6. Função para salvar referência da mensagem original
export async function saveMessageRef(env, eventId, channelId, messageId) {
    const db = getDb(env);
    const eventRef = doc(db, 'events', eventId);

    await updateDoc(eventRef, {
        channel_id: channelId,
        message_id: messageId
    });
}

// 7. Função para cancelar um evento
export async function cancelEvent(env, eventId) {
    const db = getDb(env);
    const eventRef = doc(db, 'events', eventId);

    await updateDoc(eventRef, {
        status: 'cancelled'
    });

    const snapshot = await getDoc(eventRef);
    return snapshot.data();
}

// ===== FUNÇÕES DE POLLS =====

// 8. Função para criar uma enquete
export async function createPoll(env, pollData) {
    const db = getDb(env);
    const docRef = await addDoc(collection(db, 'polls'), {
        ...pollData,
        created_at: new Date().toISOString(),
        voters: [] // Array de IDs de quem já votou
    });
    return docRef.id;
}

// 9. Função para buscar uma enquete
export async function getPoll(env, pollId) {
    const db = getDb(env);
    const docRef = doc(db, 'polls', pollId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
        return snapshot.data();
    }
    return null;
}

// 10. Função para registrar voto
export async function recordVote(env, pollId, userId, optionIndex) {
    const db = getDb(env);
    const pollRef = doc(db, 'polls', pollId);

    const snapshot = await getDoc(pollRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    // Verificar se usuário já votou
    if (data.voters && data.voters.includes(userId)) {
        return null; // Já votou
    }

    // Incrementar voto na opção escolhida
    const updatedVotes = [...data.votes];
    updatedVotes[optionIndex] = (updatedVotes[optionIndex] || 0) + 1;

    // Adicionar usuário à lista de votantes
    const updatedVoters = [...(data.voters || []), userId];

    await updateDoc(pollRef, {
        votes: updatedVotes,
        voters: updatedVoters
    });

    return { ...data, votes: updatedVotes, voters: updatedVoters };
}

// 11. Função para salvar referência da mensagem da enquete
export async function savePollMessageRef(env, pollId, channelId, messageId) {
    const db = getDb(env);
    const pollRef = doc(db, 'polls', pollId);

    await updateDoc(pollRef, {
        channel_id: channelId,
        message_id: messageId
    });
}