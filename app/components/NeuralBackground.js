// Inspired by a neuron/synapse network: small glowing nodes linked by
// branching connections, tiled across the page as a subtle texture
// behind the existing gradient wash — kept in the PharmFetch palette
// instead of the clip's dark navy, so the light theme stays intact.
export default function NeuralBackground() {
  return (
    <svg className="bg-neural" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id="neural-tile" width="190" height="190" patternUnits="userSpaceOnUse">
          <line x1="24" y1="34" x2="96" y2="78" className="neural-line" />
          <line x1="96" y1="78" x2="160" y2="26" className="neural-line" />
          <line x1="96" y1="78" x2="64" y2="156" className="neural-line" />
          <line x1="64" y1="156" x2="148" y2="168" className="neural-line" />
          <line x1="24" y1="34" x2="12" y2="128" className="neural-line" />
          <line x1="160" y1="26" x2="184" y2="104" className="neural-line" />
          <circle cx="24" cy="34" r="3" className="neural-node" style={{ animationDelay: '0s' }} />
          <circle cx="96" cy="78" r="4" className="neural-node" style={{ animationDelay: '.7s' }} />
          <circle cx="160" cy="26" r="2.5" className="neural-node" style={{ animationDelay: '1.4s' }} />
          <circle cx="64" cy="156" r="3" className="neural-node" style={{ animationDelay: '2.1s' }} />
          <circle cx="148" cy="168" r="2.5" className="neural-node" style={{ animationDelay: '2.8s' }} />
          <circle cx="12" cy="128" r="2" className="neural-node" style={{ animationDelay: '3.5s' }} />
          <circle cx="184" cy="104" r="2" className="neural-node" style={{ animationDelay: '4.2s' }} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#neural-tile)" />
    </svg>
  );
}
