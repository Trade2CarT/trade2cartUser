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
                    <svg viewBox="0 0 24 24">
                        <path d="M19.5,8.5h-1.85l-3.29-5.92c-0.22-0.4-0.69-0.57-1.09-0.35s-0.57,0.69-0.35,1.09L15.36,8.5H8.64l2.45-5.18 c0.22-0.4,0.05-0.88-0.35-1.09c-0.4-0.22-0.88-0.05-1.09,0.35L6.35,8.5H4.5C4.22,8.5,4,8.72,4,9s0.22,0.5,0.5,0.5h1.28l1.7,7.63 c0.12,0.55,0.61,0.96,1.18,0.96h6.67c0.57,0,1.06-0.41,1.18-0.96l1.7-7.63h1.28c0.28,0,0.5-0.22,0.5-0.5S19.78,8.5,19.5,8.5z M14.89,17.1H9.11l-1.42-6.37h8.62L14.89,17.1z" />
                        <circle cx="9.5" cy="19.5" r="1.5" />
                        <circle cx="15.5" cy="19.5" r="1.5" />
                    </svg>
                </Cart>
            </AnimationContainer>
        </LoaderWrapper>
    );
};

export default Loader;
