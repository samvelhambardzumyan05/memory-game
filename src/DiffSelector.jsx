import { getModeOptions } from './gameConfig.js';

function DifficultySelector({ difficulty, onChange, disabled }) {
  const difficulties = getModeOptions();

  const handleChange = (newDiff) => {
    if (!disabled || window.confirm('Changing difficulty will reset your progress. Continue?')) {
      onChange(newDiff);
    }
  };

  return (
    <div className="difficulty-selector">
      {difficulties.map((diff) => (
        <button
          key={diff.id}
          type="button"
          className={`difficulty-btn ${difficulty === diff.id ? 'active' : ''}`}
          onClick={() => handleChange(diff.id)}
          disabled={disabled}
        >
          {diff.label}
        </button>
      ))}
    </div>
  );
}

export default DifficultySelector;
