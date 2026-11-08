// Bold A logo mark, traced from the generated concept (see public/assets/img/logo-concepts/traced-a.svg).
export function Mark() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <path
        style={{ fill: 'var(--accent)' }}
        fillRule="evenodd"
        d="M 77.476 71.750 C 65.521 95.263, 49.910 125.862, 42.786 139.750 L 29.833 165 44.908 165 L 59.983 165 65.500 154 C 68.534 147.950, 71.476 143, 72.038 143 C 73.792 143, 114.484 136.841, 114.802 136.528 C 115.214 136.121, 104.636 130.294, 92.257 124.107 L 82.013 118.988 90.743 101.494 C 95.545 91.872, 99.746 84, 100.078 84 C 100.411 84, 103.639 90.188, 107.252 97.750 C 110.865 105.313, 119.774 123.537, 127.051 138.250 L 140.281 165 155.222 165 L 170.164 165 155.709 136.750 C 147.759 121.213, 132.160 90.613, 121.044 68.750 C 109.928 46.887, 100.468 29, 100.023 29 C 99.577 29, 89.431 48.237, 77.476 71.750"
      />
    </svg>
  );
}

export function Ball() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#f4f4f8" stroke="#1a1a22" strokeWidth="1.5" />
      <path d="M12 7.2l4.6 3.3-1.8 5.4H9.2l-1.8-5.4z" fill="#1a1a22" />
    </svg>
  );
}
