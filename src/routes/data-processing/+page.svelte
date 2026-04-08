<svelte:head>
  <title>Data Processing Notice · HyperType</title>
</svelte:head>

<section class="shell legal-page">
  <p class="eyebrow mono">Legal</p>
  <h1>Data Processing Notice</h1>
  <p class="meta">Last updated: April 7, 2026</p>
  <p class="subtle">
    This notice explains operational data handling, rights workflows, and controls for HyperType.
  </p>

  <article class="panel legal-card">
    <h2>1. Roles</h2>
    <ul>
      <li>HyperType operator acts as data controller for player-submitted and operational data.</li>
      <li>Infrastructure providers process data on behalf of the operator under their service terms.</li>
    </ul>
  </article>

  <article class="panel legal-card">
    <h2>2. Data Categories and Sources</h2>
    <ul>
      <li>Direct user inputs: player name and gameplay actions used for scoring and integrity checks.</li>
      <li>Derived metrics: WPM, accuracy, and quality indicators computed from game events.</li>
      <li>Operational/security data: request metadata and IP-related rate-limit keys.</li>
      <li>Client-side storage data: local settings and local last-score cache.</li>
    </ul>
  </article>

  <article class="panel legal-card">
    <h2>3. Processing Purposes</h2>
    <ul>
      <li>Run the typing session and publish leaderboard records.</li>
      <li>Protect service integrity using anti-cheat and abuse controls.</li>
      <li>Diagnose incidents and preserve operational security.</li>
      <li>Handle legal requests and rights claims.</li>
    </ul>
  </article>

  <article class="panel legal-card">
    <h2>4. Rights Request Workflow</h2>
    <ul>
      <li>Requests are accepted by email at <a href="mailto:privacy@example.com">privacy@example.com</a>.</li>
      <li>Request types: access, correction, deletion, restriction, objection, portability, consent withdrawal.</li>
      <li>Verification may be required before action to prevent unauthorized disclosure or deletion.</li>
      <li>Responses are handled within timelines required by applicable law in the requester jurisdiction.</li>
    </ul>
  </article>

  <article class="panel legal-card">
    <h2>5. Deletion Requests (No Self-Service Endpoint)</h2>
    <p class="subtle">
      HyperType currently does not provide a public in-app deletion endpoint. Deletion and rights
      requests are processed through email support only.
    </p>
  </article>

  <article class="panel legal-card">
    <h2>6. Security Controls</h2>
    <ul>
      <li>Input validation for score payload boundaries and format constraints.</li>
      <li>Request controls for content type, payload size, origin enforcement, and rate limiting.</li>
      <li>Security response headers and transport hardening controls in production.</li>
    </ul>
  </article>

  <article class="panel legal-card">
    <h2>7. Data Retention and Minimization</h2>
    <ul>
      <li>Only fields needed for gameplay, ranking, and abuse prevention are processed.</li>
      <li>Leaderboard records are retained for ranking continuity unless deletion is requested.</li>
      <li>Rate-limit and abuse-control data are retained for the shortest operationally necessary period.</li>
    </ul>
  </article>

  <article class="panel legal-card">
    <h2>8. Regional Rights Coverage</h2>
    <p class="subtle">
      HyperType targets global legal compatibility and recognizes rights frameworks across major
      privacy regimes, including GDPR/UK GDPR, CCPA/CPRA-style rights, LGPD, PIPEDA, and APPI,
      subject to local applicability and mandatory legal exceptions.
    </p>
  </article>

  <article class="panel legal-card">
    <h2>9. Contact</h2>
    <p class="subtle">
      Data rights contact: <a href="mailto:privacy@example.com">privacy@example.com</a>
    </p>
  </article>
</section>

<style>
  .eyebrow {
    margin: 0;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.8rem;
  }
</style>
