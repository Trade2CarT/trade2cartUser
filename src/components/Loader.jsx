// Loader.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

// 1. Define the rotation animation
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// 2. Create the styled component for the spinner
const Spinner = styled.div`
  /* Size */
  width: 40px;
  height: 40px;

  /* Style */
  border: 5px solid rgba(0, 0, 0, 0.1); /* Light grey track */
  border-left-color: #22a6b3; /* Color of the spinning part */
  border-radius: 50%;

  /* Animation */
  animation: ${rotate} 1s linear infinite;
`;

// 3. Define the Loader component
const Loader = () => {
    return <Spinner />;
};

export default Loader;