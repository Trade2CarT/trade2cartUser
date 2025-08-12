import React from 'react';
import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 75%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-10px);
  }
`;

const DotWrapper = styled.div`
  display: flex;
  align-items: flex-end;
`;

const Dot = styled.div`
  background-color: #333;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 0 4px;
  animation: ${bounce} 1.2s linear infinite;
  
  /* Add animation delay for each dot */
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

const Loader = () => {
    return (
        <DotWrapper>
            <Dot />
            <Dot />
            <Dot />
        </DotWrapper>
    );
};

export default Loader;