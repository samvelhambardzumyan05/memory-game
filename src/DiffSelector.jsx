function DifficultySelector({ difficulty, onChange, disabled }) {
  const difficulties = [
    { id: 'easy', label: 'Easy (4×4)' },
    { id: 'medium', label: 'Medium (6×6)' },
    { id: 'hard', label: 'Hard (8×8)' },
  ];

  const handleChange = (newDiff) => {
    if (!disabled || window.confirm("Changing difficulty will reset your progress. Continue?")) {
      onChange(newDiff);
    }
  };

  return (
    <div className="difficulty-selector">
      {difficulties.map((diff) => (
        <button
          key={diff.id}
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