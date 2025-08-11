import React from "react";

const Loader = () => {
    const styles = {
        wrapper: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "white",
        },
        svg: {
            animation: "drive 2s linear infinite",
        },
        text: {
            fontSize: "1rem",
            fontWeight: 600,
            color: "#4caf50",
            marginTop: "10px",
        },
        keyframes: `
      @keyframes drive {
        0% { transform: translateX(-100px) rotate(0deg); }
        50% { transform: translateX(100px) rotate(0deg); }
        100% { transform: translateX(-100px) rotate(0deg); }
      }
    `,
    };

    return (
        <div style={styles.wrapper}>
            <style>{styles.keyframes}</style>
            <svg
                style={styles.svg}
                width="80"
                height="80"
                viewBox="0 0 64 64"
                fill="none"
            >
                {/* Truck Body */}
                <rect x="8" y="28" width="32" height="12" rx="2" fill="#4CAF50" />
                <rect x="40" y="24" width="12" height="16" rx="2" fill="#FFC107" />

                {/* Wheels */}
                <circle cx="16" cy="44" r="4" fill="#333" />
                <circle cx="32" cy="44" r="4" fill="#333" />
                <circle cx="48" cy="44" r="4" fill="#333" />

                {/* Scrap Items */}
                <rect x="12" y="20" width="4" height="6" fill="#8BC34A" />
                <rect x="18" y="18" width="3" height="8" fill="#607D8B" />
                <rect x="24" y="22" width="3" height="5" fill="#FF9800" />
            </svg>
            <p style={styles.text}>Loading Trade2Cart...</p>
        </div>
    );
};

export default Loader;
