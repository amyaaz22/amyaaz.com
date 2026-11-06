export function Mark() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path className="mark-stroke" d="M9 39 L24 9 L39 39" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path className="mark-stroke" d="M15.5 30 H20.2 M27.8 30 H32.5" strokeWidth="4.5" strokeLinecap="round" />
      <circle className="mark-node" cx="24" cy="30" r="3.6" />
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
