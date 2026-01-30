'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase/client';
import styles from './page.module.css';

export default function HomePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState(null);

    // Monitor authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
                setUser(currentUser);
                setAuthLoading(false);
            },
            (error) => {
                console.error('Auth state change error:', error);
                setAuthLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Load events after auth resolves
    useEffect(() => {
        if (!authLoading) {
            loadEvents();
        }
    }, [authLoading, user]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (showDropdown && !event.target.closest(`.${styles.userMenu}`)) {
                setShowDropdown(false);
            }
        }

        if (showDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showDropdown]);

    // Fetch events from Firestore
    async function loadEvents() {
        setEventsLoading(true);
        setError(null);

        try {
            const eventsRef = collection(db, 'events');
            let allEvents = [];

            // Fetch public events
            try {
                const publicQuery = query(eventsRef, where('visibility', '==', 'public'));
                const publicSnapshot = await getDocs(publicQuery);
                allEvents = publicSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (err) {
                console.error('Error fetching public events:', err);
            }

            // Fetch user's private events if logged in
            if (user) {
                try {
                    const privateQuery = query(
                        eventsRef,
                        where('visibility', '==', 'private'),
                        where('organizer_id', '==', user.uid)
                    );
                    const privateSnapshot = await getDocs(privateQuery);

                    // Merge without duplicates
                    const eventIds = new Set(allEvents.map(e => e.id));
                    privateSnapshot.docs.forEach(doc => {
                        if (!eventIds.has(doc.id)) {
                            allEvents.push({ id: doc.id, ...doc.data() });
                        }
                    });
                } catch (err) {
                    console.error('Error fetching private events:', err);
                }
            }

            // Sort by date (newest first)
            allEvents.sort((a, b) => {
                const dateA = a.created_at?.toDate?.() || new Date(0);
                const dateB = b.created_at?.toDate?.() || new Date(0);
                return dateB - dateA;
            });

            setEvents(allEvents);
        } catch (err) {
            console.error('Critical error loading events:', err);
            setError('Erro ao carregar eventos. Tente novamente mais tarde.');
        } finally {
            setEventsLoading(false);
        }
    }

    async function handleLogout() {
        try {
            await signOut(auth);
            setShowDropdown(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    return (
        <>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.navContainer}>
                    <div className={styles.logo}>🔥 Brasa Bot</div>

                    <div className={styles.navRight}>
                        {authLoading ? (
                            <div style={{ color: '#888', fontSize: '14px' }}>Carregando...</div>
                        ) : user ? (
                            <div className={styles.userMenu}>
                                <button
                                    className={styles.avatar}
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    title={user.displayName || user.email}
                                >
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName || 'User'} />
                                    ) : (
                                        <span>{(user.displayName || user.email)?.[0]?.toUpperCase() || 'U'}</span>
                                    )}
                                </button>

                                {showDropdown && (
                                    <div className={styles.dropdown}>
                                        <div className={styles.dropdownHeader}>
                                            <strong>{user.displayName || 'Usuário'}</strong>
                                            <small>{user.email}</small>
                                        </div>
                                        <hr className={styles.dropdownDivider} />
                                        <button
                                            className={styles.dropdownItem}
                                            onClick={() => {
                                                setShowDropdown(false);
                                                router.push('/profile');
                                            }}
                                        >
                                            ⚙️ Configurações
                                        </button>
                                        <button
                                            className={styles.dropdownItem}
                                            onClick={handleLogout}
                                        >
                                            🚪 Sair
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/login')}
                                className={styles.btnLogin}
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>
                        O Churrasco perfeito <br />
                        <span className={styles.heroHighlight}>começa aqui</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Organize, convide e gerencie tudo em um só lugar
                    </p>
                    {user ? (
                        <button
                            className={styles.btnCta}
                            onClick={() => router.push('/eventos/criar')}
                        >
                            🔥 Criar Evento
                        </button>
                    ) : (
                        <button
                            className={styles.btnCta}
                            onClick={() => router.push('/login')}
                        >
                            Começar Agora
                        </button>
                    )}
                </div>
            </section>

            {/* Events List */}
            <section className={styles.events}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>Próximos Churrascos</h2>

                    {error && (
                        <div className={styles.errorBox}>⚠️ {error}</div>
                    )}

                    {eventsLoading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Carregando eventos...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>🔥</div>
                            <p>Nenhum evento disponível no momento.</p>
                            {user && (
                                <button
                                    className={styles.btnCreate}
                                    onClick={() => router.push('/eventos/criar')}
                                >
                                    Criar Primeiro Evento
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.eventsGrid}>
                            {events.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    currentUser={user}
                                    onView={() => router.push(`/eventos/${event.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

function EventCard({ event, currentUser, onView }) {
    const isPrivate = event.visibility === 'private';
    const isOwner = currentUser?.uid === event.organizer_id;

    return (
        <div className={styles.card}>
            {isPrivate && (
                <div className={styles.badge}>🔒 Privado</div>
            )}

            <h3 className={styles.cardTitle}>{event.title || 'Sem título'}</h3>
            <p className={styles.cardDate}>📅 {event.date || 'Data não definida'}</p>

            {event.location && (
                <p className={styles.cardLocation}>📍 {event.location}</p>
            )}

            {event.amount > 0 && (
                <p className={styles.cardAmount}>
                    💰 R$ {event.amount.toFixed(2).replace('.', ',')}
                </p>
            )}

            <p className={styles.cardOrganizer}>
                👑 {event.organizer_name || 'Organizador'}
            </p>

            <div className={styles.cardStats}>
                <span>✅ {event.attendees?.length || 0} confirmados</span>
                {isOwner && <span className={styles.ownerBadge}>Seu evento</span>}
            </div>

            <button className={styles.btnView} onClick={onView}>
                Ver Detalhes
            </button>
        </div>
    );
}
