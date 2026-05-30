import { X } from 'lucide-react';
import ExerciseAutocomplete from '../ExerciseAutocomplete';

export default function AddExerciseRow({ index, onAddExercise, onCancel }) {
  return (
    <div className="routine-add-row">
      <span className="routine-row-index">
        {index + 1}
      </span>

      <div className="routine-add-row-search">
        <ExerciseAutocomplete
          onSelect={onAddExercise}
          onCancel={onCancel}
          autoFocus={true}
          placeholder="추가할 운동 검색..."
        />
      </div>

      <div className="routine-add-row-actions">
        <button
          onClick={onCancel}
          className="routine-add-row-cancel"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
