import React from 'react';
import './App.css';

const Card = ({ id, content, isFlipped, isMatched, onClick, disabled }) => {
  const handleClick = () => {
    if (!disabled && !isFlipped && !isMatched) {
      onClick(id);
    }
  };

  return (
    <div 
      className={`card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
      onClick={handleClick}
    >
      <div className="card-inner">
        <div className="card-front">?</div>
        <div className="card-back">{content}</div>
      </div>
    </div>
  );
};

export default Card;