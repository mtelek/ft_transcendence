type EditableField = "username" | "email" | "password";

//Shared row used by the settings page for editable profile fields
type EditableFieldRowProps = {
  label: string;
  field: EditableField;
  editingField: EditableField | null;
  value: string;
  displayValue: string;
  isSaving: boolean;
  onChangeValue: (value: string) => void;
  onStartEdit: (field: EditableField) => void;
  onSave: (field: EditableField) => void;
  onCancel: () => void;
  inputType?: "text" | "password";
  placeholder?: string;
};

export default function EditableFieldRow({
  label,
  field,
  editingField,
  value,
  displayValue,
  isSaving,
  onChangeValue,
  onStartEdit,
  onSave,
  onCancel,
  inputType = "text",
  placeholder,
}: EditableFieldRowProps) {
  //Only the row matching editingField should render its input/actions in edit mode
  const isEditing = editingField === field;

  return (
    <div className="flex items-center justify-between gap-4 border border-gray-700 rounded-lg p-3">
      <div className="flex-1">
        <p className="text-sm text-gray-400">{label}</p>
        {isEditing ? (
          //In edit mode, show the controlled input for the current field value
          <input
            type={inputType}
            value={value}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder={placeholder}
            className="mt-1 w-full rounded bg-zinc-800 px-3 py-2 text-white outline-none ring-1 ring-zinc-600 focus:ring-green-500"
          />
        ) : (
          <p className="mt-1 text-white">{displayValue}</p>
        )}
      </div>

      {isEditing ? (
        //Save/cancel actions replace the default change button while editing
        <div className="flex gap-2">
          <button
            onClick={() => onSave(field)}
            disabled={isSaving}
            className="rounded bg-green-600 px-3 py-2 text-sm hover:bg-green-700 disabled:opacity-60"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="rounded bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => onStartEdit(field)}
          className="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-700"
        >
          Change
        </button>
      )}
    </div>
  );
}
