import React from 'react';
import styled, { keyframes } from 'styled-components';

// --- Keyframes for Animations ---

const l6_0 = keyframes`
  0%,30%   {background-position: 0 0   ,50% 0   }
  33%      {background-position: 0 100%,50% 0   }
  41%,63% {background-position: 0 0   ,50% 0   }
  66%      {background-position: 0 0   ,50% 100%}
  74%,100%{background-position: 0 0   ,50% 0   }
`;

const l6_1 = keyframes`
  90%  {transform:translateY(0)}
  95%  {transform:translateY(15px)}
  100% {transform:translateY(15px);left:calc(100% - 8px)}
`;

const l6_2 = keyframes`
  100% {top:-0.1px}
`;

const l6_3 = keyframes`
  0%,80%,100% {transform:translate(0)}
  90%          {transform:translate(26px)}
`;

// --- Styled Components ---

const StyledLoader = styled.div`
  width: 40px;
  height: 20px;
  --c: no-repeat radial-gradient(farthest-side, #000 93%, #0000);
  background:
    var(--c) 0    0,
    var(--c) 50%  0;
  background-size: 8px 8px;
  position: relative;
  clip-path: inset(-200% -100% 0 0);
  animation: ${l6_0} 1.5s linear infinite;

  &::before {
    content: "";
    position: absolute;
    width: 8px;
    height: 12px;
    background: #000;
    left: -16px;
    top: 0;
    animation: 
      ${l6_1} 1.5s linear infinite,
      ${l6_2} 0.5s cubic-bezier(0,200,.8,200) infinite;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0 0 auto auto;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #000;  
    animation: ${l6_3} 1.5s linear infinite;
  }
`;

// A wrapper to center the loader on the page for display
const AppWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  font-family: 'Inter', sans-serif;
`;

// --- React Component ---

const Loader = () => {
    return <StyledLoader />;
};

// Main App component to render the loader
const App = () => {
    return (
        <AppWrapper>
            <Loader />
        </AppWrapper>
    )
}


export default App;
