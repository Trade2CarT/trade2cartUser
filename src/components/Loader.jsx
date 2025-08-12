// Loader.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

// 1. Define the rotation animation for the spinner
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// 2. Create the styled component for the centering wrapper
// It accepts a 'fullscreen' prop to adjust its height
const LoaderWrapper = styled.div`
  width: 100%;
  height: ${props => (props.fullscreen ? '100vh' : '100%')};
  display: flex;
  justify-content: center;
  align-items: center;

  /* If the loader is inside a container with a dark background,
     you might want to ensure it has its own background or is visible */
`;

// 3. Create the styled component for the spinner itself
const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 5px solid rgba(0, 0, 0, 0.1); /* Light grey track */
  border-left-color: #22a6b3;           /* Color of the spinning part */
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

// 4. Define the final Loader component
// It accepts a 'fullscreen' prop and passes it to the wrapper
const Loader = ({ fullscreen }) => {
    return (
        <LoaderWrapper fullscreen={fullscreen}>
            <Spinner />
        </LoaderWrapper>
    );
};

export default Loader;