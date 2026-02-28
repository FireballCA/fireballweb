import './IOSCheckbox.css'

interface IOSCheckboxProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  color?: 'red' | 'blue'
  sizeEm?: number
}

export function IOSCheckbox({ id, checked, onChange, color = 'red', sizeEm = 1.12 }: IOSCheckboxProps) {
  return (
    <div className="ios-checkbox-root">
      <input
        id={id}
        type="checkbox"
        className="container-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} className="container" data-color={color}>
        <svg viewBox="0 0 64 64" height={`${sizeEm}em`} width={`${sizeEm}em`}>
          <path
            d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
            pathLength="575.0541381835938"
            className="path"
          />
        </svg>
      </label>
    </div>
  )
}
