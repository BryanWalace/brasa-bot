'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithCustomToken,
    updateProfile
} from 'firebase/auth';
import { auth } from '../../firebase/client';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle custom token from Discord OAuth callback
    useEffect(() => {
        const token = searchParams.get('token');
        const authError = searchParams.get('error');

        if (authError) {
            const errorMessage = decodeURIComponent(authError);
            setError(`Erro no login Discord: ${errorMessage}`);
            return;
        }

        if (token) {
            handleCustomToken(token);
        }
    }, [searchParams]);

    // Discord OAuth Custom Token authentication
    async function handleCustomToken(token) {
        setLoading(true);
        setError('');

        try {
            const userCredential = await signInWithCustomToken(auth, token);

            // Extract custom claims from JWT
            const [, claimsBase64] = token.split('.');
            const claims = JSON.parse(atob(claimsBase64));

            // Update user profile with Discord data
            if (claims.claims) {
                await updateProfile(userCredential.user, {
                    displayName: claims.claims.name,
                    photoURL: claims.claims.picture
                });
            }

            router.replace('/');
        } catch (err) {
            console.error('Custom token authentication error:', err);
            setError('Erro ao processar autenticação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    // Email/Password authentication
    async function handleEmailSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'signup') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }

            router.push('/');
        } catch (err) {
            console.error('Email authentication error:', err);
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    }

    function getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'Este email já está cadastrado.',
            'auth/invalid-email': 'Email inválido.',
            'auth/operation-not-allowed': 'Operação não permitida.',
            'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
            'auth/user-disabled': 'Esta conta foi desativada.',
            'auth/user-not-found': 'Usuário não encontrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/invalid-credential': 'Credenciais inválidas. Verifique email e senha.',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
            'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
        };

        return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente.';
    }

    const workerAuthUrl = process.env.NEXT_PUBLIC_WORKER_URL
        ? `${process.env.NEXT_PUBLIC_WORKER_URL}/auth/discord`
        : 'http://localhost:8787/auth/discord';

    return (
        <main className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>🔥</div>
                <h1 className={styles.title}>
                    {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                </h1>
                <p className={styles.subtitle}>
                    {mode === 'login'
                        ? 'Entre para gerenciar seus churrascos'
                        : 'Cadastre-se para começar'}
                </p>

                {error && (
                    <div className={styles.error}>⚠️ {error}</div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleEmailSubmit} className={styles.form}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={styles.input}
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className={styles.input}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className={styles.btnSubmit}
                        disabled={loading}
                    >
                        {loading
                            ? 'Carregando...'
                            : mode === 'login' ? 'Entrar' : 'Criar Conta'}
                    </button>
                </form>

                {/* Toggle Mode */}
                <button
                    onClick={() => {
                        setMode(mode === 'login' ? 'signup' : 'login');
                        setError('');
                    }}
                    className={styles.btnToggle}
                    disabled={loading}
                >
                    {mode === 'login' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
                </button>

                <div className={styles.divider}>
                    <span>ou</span>
                </div>

                {/* Discord OAuth */}
                <a
                    href={workerAuthUrl}
                    className={styles.btnDiscord}
                    aria-label="Entrar com Discord"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Entrar com Discord
                </a>

                <button
                    onClick={() => router.push('/')}
                    className={styles.btnBack}
                >
                    ← Voltar para Home
                </button>
            </div>
        </main>
    );
}
