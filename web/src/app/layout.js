import './globals.css';

export const metadata = {
    title: 'Brasa Bot 🔥',
    description: 'Organize seu churrasco sem estresse',
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
