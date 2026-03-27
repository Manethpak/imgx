import heroIllustration from "../../assets/hero.png";
import "./OgImage.css";

export function OgImage() {
  return (
    <main className="og-page">
      <section className="og-card" aria-label="imgx social preview">
        <div className="og-card__orb og-card__orb--one" />
        <div className="og-card__orb og-card__orb--two" />
        <div className="og-card__orb og-card__orb--three" />

        <div className="og-card__topline">
          <span className="og-mark">
            <span className="og-mark__accent">img</span>x
          </span>
          <span className="og-kicker">Browser-native image toolkit</span>
        </div>

        <div className="og-card__body">
          <div className="og-copy">
            <p className="og-copy__eyebrow">Browser first</p>
            <h1 className="og-copy__title">
              Crop, resize, and export images without leaving the browser.
            </h1>
            <p className="og-copy__lead">
              imgx keeps the full image workflow local. Drop a file, tune the
              output, and ship the result without uploads or extra tabs.
            </p>

            <div className="og-pills" aria-label="key features">
              <span className="og-pill">Crop</span>
              <span className="og-pill">Resize</span>
              <span className="og-pill">Color adjust</span>
              <span className="og-pill">PNG · JPEG · WebP</span>
            </div>

            <div className="og-metrics">
              <div className="og-metric">
                <span className="og-metric__value">Fast</span>
                <span className="og-metric__label">Client-side processing</span>
              </div>
              <div className="og-metric">
                <span className="og-metric__value">Private</span>
                <span className="og-metric__label">Nothing leaves your machine</span>
              </div>
              <div className="og-metric">
                <span className="og-metric__value">Focused</span>
                <span className="og-metric__label">A clean, single-purpose UI</span>
              </div>
            </div>
          </div>

          <div className="og-visual" aria-hidden="true">
            <div className="og-visual__frame">
              <div className="og-visual__bar">
                <div className="og-visual__chrome">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="og-visual__url">
                  <span className="og-visual__url-dot" />
                  local editor preview
                </div>
              </div>
              <div className="og-visual__frame-glow" />
              <div className="og-visual__stage">
                <div className="og-visual__checkerboard" />
                <img
                  src={heroIllustration}
                  alt=""
                  className="og-visual__hero"
                  draggable={false}
                />
                <div className="og-visual__badge og-visual__badge--top">
                  <span>Output</span>
                  <strong>1200 × 630</strong>
                </div>
                <div className="og-visual__badge og-visual__badge--bottom">
                  <span>Local first</span>
                  <strong>No uploads</strong>
                </div>
              </div>
            </div>

            <div className="og-visual__controls">
              <span>Rotate</span>
              <span>Crop</span>
              <span>Colors</span>
              <span>Export</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
