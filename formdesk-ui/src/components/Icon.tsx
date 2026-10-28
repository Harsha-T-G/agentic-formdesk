export function Icon({
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  return (
    <svg className={`icon${small ? " small" : ""}`} aria-hidden="true">
      <use href={`/icons.svg#i-${name}`} />
    </svg>
  );
}
