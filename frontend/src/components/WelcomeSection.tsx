import { useAuth } from '../context/AuthContext';

const MOTIVATIONAL_QUOTES = [
    "Believe you can and you're halfway there.",
    "Your only limit is your mind.",
    "Every small step counts.",
    "Success is a journey, not a destination.",
    "Stay positive, work hard, make it happen.",
    "Do something today that your future self will thank you for.",
    "The secret of getting ahead is getting started.",
];

export function WelcomeSection() {
    const { user } = useAuth();

    if (!user) return null;

    const firstName = user.displayName?.split(' ')[0] || 'User';
    const quoteIndex = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
    const selectedQuote = MOTIVATIONAL_QUOTES[quoteIndex];

    return (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 overflow-hidden">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 leading-tight">
                    Welcome {firstName}!
                </h2>
                <p className="text-xs text-gray-500 italic opacity-80 mt-0.5">
                    "{selectedQuote}"
                </p>
            </div>
            {/* Space for future additions beside it */}
            <div id="welcome-section-extra" />
        </div>
    );
}
