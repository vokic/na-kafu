// Holographic animated background (shown only when data-theme="holo" via CSS).
export default function HoloBg() {
  return (
    <div className="holobg">
      <div className="mesh">
        <div className="flow" />
        <div className="sheen" />
        <div className="blob bA" />
        <div className="blob bB" />
        <div className="streak" />
      </div>
    </div>
  );
}
