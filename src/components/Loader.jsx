// Loader.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

// --- Animation Keyframes ---

// Keyframes for the items flying into the cart
const addToCartAnimation = keyframes`
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(1);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(45px, -25px) scale(0.3);
  }
`;

// Keyframes for a subtle cart jiggle
const cartJiggle = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-2px);
  }
`;

// --- Styled Components ---

// The main wrapper for centering the loader
const LoaderWrapper = styled.div`
  width: 100%;
  height: ${props => (props.fullscreen ? '100vh' : '100%')};
  display: flex;
  justify-content: center;
  align-items: center;
`;

// Container for the cart and the animated items
const AnimationContainer = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
`;

// The shopping cart icon
const Cart = styled.div`
  position: absolute;
  bottom: 0;
  left: 10px;
  width: 60px;
  height: 60px;
  animation: ${cartJiggle} 1.5s ease-in-out infinite;

  // SVG for the cart icon
  svg {
    width: 100%;
    height: 100%;
    fill: #34495e; // A nice, dark slate color
  }
`;

// The items that fly into the cart
const Item = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 15px;
  height: 15px;
  background-color: #2ecc71; // A vibrant green, suggesting success/addition
  border-radius: 50%;
  opacity: 0;
  animation: ${addToCartAnimation} 1.5s ease-in-out infinite;

  // Stagger the animation for each item
  &:nth-child(1) {
    animation-delay: 0s;
  }
  &:nth-child(2) {
    animation-delay: 0.25s;
    background-color: #3498db; // A different color for variety
  }
  &:nth-child(3) {
    animation-delay: 0.5s;
  }
`;


// --- The Main Loader Component ---

const Loader = ({ fullscreen }) => {
    return (
        <LoaderWrapper fullscreen={fullscreen}>
            <AnimationContainer>
                {/* The items to be animated */}
                <Item />
                <Item />
                <Item />

                {/* The cart icon */}
                <Cart>
                    {/* --- UPDATED SVG ICON --- */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                </Cart>
            </AnimationContainer>
        </LoaderWrapper>
    );
};

export default Loader;
