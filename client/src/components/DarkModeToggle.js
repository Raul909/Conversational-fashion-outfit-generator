import React from 'react';

const DarkModeToggle = ({ darkMode, setDarkMode }) => {
    return (
        <button
            onClick={() => setDarkMode(!darkMode)}
            className="fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300 hover:scale-110"
            style={{
                background: darkMode
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {darkMode ? (
                // Sun icon for light mode
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Moon icon for dark mode  
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
};

export default DarkModeToggle;
