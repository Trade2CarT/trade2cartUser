import React from 'react';
import styled, { keyframes } from 'styled-components';

// --- Keyframes for Animations ---

const truckAction = keyframes`
    0%, 15% { transform: translateX(350px); }
    35% { transform: translateX(120px); } /* Adjusted arrival position */
    70% { transform: translateX(120px); }
    95%, 100% { transform: translateX(350px); } /* CORRECTED: Moves right off-screen */
`;

const truckSuspension = keyframes`
    0% { transform: translateY(0px); }
    50% { transform: translateY(3px); }
    100% { transform: translateY(0px); }
`;

const spinWheels = keyframes`
    0%, 15% { transform: rotate(0deg); }
    35% { transform: rotate(-720deg); }
    70% { transform: rotate(-720deg); }
    95% { transform: rotate(0deg); } /* Wheels spin forward on exit */
    100% { transform: rotate(0deg); }
`;

const userActions = keyframes`
    0%, 100% { opacity: 0; }
    5%, 95% { opacity: 1; }
`;

const scrapAction = keyframes`
    0%, 48% { opacity: 1; transform: translate(0, 0); }
    60% { opacity: 1; transform: translate(20px, -45px) rotate(30deg) scale(0.9); }
    65%, 100% { opacity: 0; transform: translate(20px, -15px) scale(0.5); }
`;

const coinPopup = keyframes`
    0%, 75% { opacity: 0; transform: translateY(20px) scale(0.5); }
    85% { opacity: 1; transform: translateY(0) scale(1.2); }
    95% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; }
`;


// --- Styled Components ---

const StyledLoaderWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #FFFFFF;
    font-family: 'Inter', sans-serif;
    overflow: hidden;

    .loader-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .animation-stage {
        position: relative;
        width: 350px;
        height: 180px;
        border-bottom: 2px solid #E0E0E0;
    }
    
    .animated-element {
        position: absolute;
        bottom: 0;
        transform-origin: center bottom;
    }

    /* --- Scene Elements --- */
    .background-houses {
        width: 100%;
        height: 100%;
        opacity: 0.8;
    }
    .house-1 {
        position: absolute;
        bottom: 0;
        left: -30px;
        width: 120px;
    }
     .house-2 {
        position: absolute;
        bottom: 0;
        left: 200px;
        width: 140px;
    }

    .user-container {
        left: 80px;
        width: 50px;
        height: 70px;
        animation: ${userActions} 7s ease-in-out infinite;
    }
    
    .scrap-pile {
        left: 130px;
        width: 30px;
        animation: ${scrapAction} 7s ease-in-out infinite;
    }

    /* --- TRUCK STYLES --- */
    .truck-container {
        width: 200px;
        height: 100px;
        animation: ${truckAction} 7s cubic-bezier(0.6, 0, 0.4, 1) infinite;
    }
    .truck-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
    }
    .truck-body {
        position: absolute;
        bottom: 18px;
        width: 100%;
        animation: ${truckSuspension} 1s linear infinite;
    }
    .truck-tires {
        position: absolute;
        bottom: 0;
        width: 130px;
        height: 30px;
        display: flex;
        justify-content: space-between;
        padding: 0px 10px 0px 15px;
        left: 35px;
    }
    .truck-tires .wheel {
        width: 24px;
        animation: ${spinWheels} 7s linear infinite;
    }
    .truck-shadow {
        position: absolute;
        bottom: -2px;
        left: 50%;
        width: 80%;
        height: 8px;
        background: rgba(0,0,0,0.1);
        border-radius: 50%;
        transform: translateX(-50%);
        filter: blur(3px);
    }

    .coin {
        left: 90px;
        bottom: 30px;
        width: 35px;
        animation: ${coinPopup} 7s ease-in-out infinite;
    }

    .loader-tagline {
        color: #333333;
    }
`;


// --- React Component ---

const Loader = () => {
    return (
        <StyledLoaderWrapper>
            <div className="loader-container">
                <div className="animation-stage">
                    {/* Scene Elements */}
                    <div className="background-houses">
                        <div className="animated-element house-1">
                            <svg viewBox="0 0 120 100"><path d="M0,100 V40 L60,0 L120,40 V100 H90 V60 H30 V100 Z" fill="#F0F0F0" /><path d="M40 70 H 80 V 100 H 40 Z" fill="#D0D0D0" /></svg>
                        </div>
                        <div className="animated-element house-2">
                            <svg viewBox="0 0 140 120"><path d="M0,120 V50 L70,0 L140,50 V120" fill="#E8E8E8" /><rect x="40" y="70" width="60" height="50" fill="#C8C8C8" /></svg>
                        </div>
                    </div>

                    <div className="animated-element user-container">
                        <svg className="user-svg" viewBox="0 0 50 70">
                            <g fill="#FF9800">
                                <circle cx="25" cy="10" r="8" />
                                <rect x="18" y="18" width="14" height="25" rx="7" />
                            </g>
                            <g fill="#333">
                                <rect className="user-legs" x="18" y="43" width="5" height="20" rx="2.5" />
                                <rect className="user-legs" x="27" y="43" width="5" height="20" rx="2.5" />
                            </g>
                            <rect className="user-arm" x="10" y="18" width="5" height="20" rx="2.5" fill="#FF9800" />
                        </svg>
                    </div>

                    <div className="animated-element scrap-pile">
                        <svg viewBox="0 0 30 30" fill="#A0A0A0"><path d="M5,25 L10,15 L15,22 L20,12 L25,25 Z M0,25 H30 V30 H0 Z" /></svg>
                    </div>

                    {/* TRUCK USING USER'S EXACT SVG */}
                    <div className="animated-element truck-container">
                        <div className="truck-shadow"></div>
                        <div className="truck-wrapper">
                            <div className="truck-body">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 198 93">
                                    <path strokeWidth="3" stroke="#282828" fill="#4CAF50" d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z" />
                                    <path strokeWidth="3" stroke="#282828" fill="#7D7C7C" d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z" />
                                    <path strokeWidth="2" stroke="#282828" fill="#282828" d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z" />
                                    <rect strokeWidth="2" stroke="#282828" fill="#FFFCAB" rx="1" height="7" width="5" y="63" x="187" />
                                    <rect strokeWidth="2" stroke="#282828" fill="#282828" rx="1" height="11" width="4" y="81" x="193" />
                                    <rect strokeWidth="3" stroke="#282828" fill="#DFDFDF" rx="2.5" height="90" width="121" y="1.5" x="6.5" />
                                    <rect strokeWidth="2" stroke="#282828" fill="#DFDFDF" rx="2" height="4" width="6" y="84" x="1" />
                                </svg>
                            </div>
                            <div className="truck-tires">
                                <div className="wheel">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30">
                                        <circle strokeWidth="3" stroke="#282828" fill="#282828" r="13.5" cy="15" cx="15" />
                                        <circle fill="#DFDFDF" r="7" cy="15" cx="15" />
                                    </svg>
                                </div>
                                <div className="wheel">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30">
                                        <circle strokeWidth="3" stroke="#282828" fill="#282828" r="13.5" cy="15" cx="15" />
                                        <circle fill="#DFDFDF" r="7" cy="15" cx="15" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coin */}
                    <div className="animated-element coin">
                        <svg viewBox="0 0 35 35">
                            <circle cx="17.5" cy="17.5" r="17.5" fill="#FF9800" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.2))" />
                            <text x="10" y="24" fontSize="18" fill="#fff" fontWeight="bold">₹</text>
                        </svg>
                    </div>
                </div>
                <p className="loader-tagline">The Smartest Choice</p>
            </div>
        </StyledLoaderWrapper>
    );
};

export default Loader;
