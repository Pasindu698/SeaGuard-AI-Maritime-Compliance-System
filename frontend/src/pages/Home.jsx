import { useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";

import {

  Anchor,

  ArrowRight,

  BookOpen,

  CheckCircle2,

  ChevronDown,

  ClipboardCheck,

  FileText,

  Menu,

  Play,

  Radar,

  ShieldCheck,

  Ship,

  Sparkles,

  X,

} from "lucide-react";



import "./Home.css";



const features = [

  {

    icon: ShieldCheck,

    title: "Security & Access Agent",

    description:

      "Protected access, user roles, authentication, and secure document handling.",

  },

  {

    icon: FileText,

    title: "Document & Query Agent",

    description:

      "Upload maritime documents, extract information, and ask questions.",

  },

  {

    icon: BookOpen,

    title: "Compliance & Retrieval Agent",

    description:

      "Retrieve relevant emergency procedures, maritime regulations, and references.",

  },

  {

    icon: Radar,

    title: "Coordinator Agent",

    description:

      "Analyze incidents, assess risk, coordinate agent outputs, and provide escalation guidance.",

  },

];



const steps = [

  {

    title: "Sign in securely",

    description:

      "Access your authorized SeaGuard AI workspace using secure authentication.",

  },

  {

    title: "Upload or select a document",

    description:

      "Provide maritime incident reports, vessel documents, or emergency procedures.",

  },

  {

    title: "Describe an incident",

    description:

      "Enter an incident description or use the available voice input feature.",

  },

  {

    title: "Review AI-assisted findings",

    description:

      "View incident risk, compliance assessment, references, and escalation guidance.",

  },

];



export default function Home() {

  const [menuOpen, setMenuOpen] = useState(false);

  const [demoOpen, setDemoOpen] = useState(false);

  const [videoFailed, setVideoFailed] = useState(false);

  const [demoFailed, setDemoFailed] = useState(false);



  const demoVideoRef = useRef(null);



  const openDemo = () => {

    setDemoFailed(false);

    setDemoOpen(true);

  };



  const closeDemo = () => {

    if (demoVideoRef.current) {

      demoVideoRef.current.pause();

      demoVideoRef.current.currentTime = 0;

    }

    setDemoOpen(false);

  };



  useEffect(() => {

    if (!demoOpen) return;



    const handleEscape = (event) => {

      if (event.key === "Escape") closeDemo();

    };



    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleEscape);



    return () => {

      document.body.style.overflow = previousOverflow;

      document.removeEventListener("keydown", handleEscape);

    };

  }, [demoOpen]);



  return (

    <div className="sg-home" id="home">

      {/* NAVIGATION */}

      <header className="sg-nav">

        <Link

          to="/"

          className="sg-brand"

          aria-label="SeaGuard AI Home"

        >

          <span className="sg-brand-mark">

            <Anchor size={29} />

          </span>



          <span className="sg-brand-text">

            <strong>

              SeaGuard <em>AI</em>

            </strong>

            <small>SAFE SEAS. SMARTER DECISIONS.</small>

          </span>

        </Link>



        <button

          type="button"

          className="sg-menu-button"

          aria-label="Toggle navigation"

          aria-expanded={menuOpen}

          onClick={() => setMenuOpen((prev) => !prev)}

        >

          {menuOpen ? <X /> : <Menu />}

        </button>



        <nav

          className={`sg-links ${menuOpen ? "sg-links-open" : ""}`}

          aria-label="Main navigation"

        >

          <a href="#home" onClick={() => setMenuOpen(false)}>

            Home

          </a>

          <a href="#features" onClick={() => setMenuOpen(false)}>

            Features

          </a>

          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>

            How It Works

          </a>

          <a href="#about" onClick={() => setMenuOpen(false)}>

            About

          </a>

                    <a href="#contact" onClick={() => setMenuOpen(false)}>
            Contact
          </a>

<Link

            to="/login"

            className="sg-mobile-login"

            onClick={() => setMenuOpen(false)}

          >

            Login

          </Link>

        </nav>



        <div className="sg-nav-actions">

          <Link to="/login" className="sg-login">

            Login

          </Link>

          <Link to="/register" className="sg-primary sg-nav-cta">

            Get Started <ArrowRight size={18} />

          </Link>

        </div>

      </header>



      <main>

        {/* HERO */}

        <section className="sg-hero">

          {/* BACKGROUND VIDEO */}

          <div className="sg-video-layer" aria-hidden="true">

            {!videoFailed && (

              <video

                autoPlay

                muted

                loop

                playsInline

                preload="metadata"

                poster="/images/seaguard-hero.png"

                onError={() => setVideoFailed(true)}

              >

                <source

                  src="/videos/ship-ocean.mp4"

                  type="video/mp4"

                />

              </video>

            )}

          </div>



          <div className="sg-hero-shade" />



          {/* MAIN HERO CONTENT */}

          <div className="sg-hero-main">

            {/* LEFT CONTENT */}

            <div className="sg-copy">

              <div className="sg-eyebrow">

                <Sparkles size={15} />

                AI-POWERED MARITIME INTELLIGENCE

              </div>



              <h1>

                Intelligent

                <br />

                <span>Maritime Safety</span>

                <br />

                Starts Here

              </h1>



              <p>

                SeaGuard AI uses coordinated AI agents to help

                maritime professionals analyze incidents, retrieve

                compliance information, and make safer, faster,

                and more informed decisions.

              </p>



              <div className="sg-hero-actions">

                <Link

                  to="/register"

                  className="sg-primary sg-large"

                >

                  Get Started <ArrowRight size={19} />

                </Link>



                <button

                  type="button"

                  className="sg-secondary sg-large"

                  onClick={openDemo}

                >

                  <Play size={19} />

                  Watch Demo

                </button>

              </div>



              <a href="#features" className="sg-scroll">

                Explore capabilities

                <ChevronDown size={17} />

              </a>

            </div>



            {/* CONNECTED AI NETWORK — only the HUD design is changed */}
            <div className="sg-orbit" aria-label="Illustrative connected maritime AI monitoring network">
              <div className="sg-orbit-ring sg-orbit-ring-outer" />
              <div className="sg-orbit-ring sg-orbit-ring-inner" />
              <svg className="sg-orbit-lines" viewBox="0 0 440 370" aria-hidden="true">
                <path d="M 220 178 L 102 84 M 220 178 L 344 84 M 220 178 L 220 300" />
                <circle cx="102" cy="84" r="4" />
                <circle cx="344" cy="84" r="4" />
                <circle cx="220" cy="300" r="4" />
              </svg>
              <div className="sg-orbit-core">
                <Radar size={29} strokeWidth={1.6} />
                <strong>SeaGuard AI</strong>
                <span>CONNECTED</span>
              </div>
              <div className="sg-orbit-node sg-orbit-incident">
                <span className="sg-orbit-node-icon"><Ship size={22} /></span>
                <strong>Incident Detection</strong>
                <small>Monitoring</small>
              </div>
              <div className="sg-orbit-node sg-orbit-risk">
                <span className="sg-orbit-node-icon"><Radar size={22} /></span>
                <strong>Risk Analysis</strong>
                <small><span className="sg-orbit-status" /> Priority check</small>
              </div>
              <div className="sg-orbit-node sg-orbit-compliance">
                <span className="sg-orbit-node-icon"><ClipboardCheck size={22} /></span>
                <strong>Compliance Check</strong>
                <small><CheckCircle2 size={12} /> SOLAS · IMO · MARPOL</small>
              </div>
            </div>
          </div>

          {/* FOUR AGENT CARDS - SEPARATE BOTTOM ROW */}

          <div className="sg-feature-strip" id="features">

            {features.map(({ icon: Icon, title, description }) => (

              <article className="sg-feature" key={title}>

                <Icon className="sg-feature-icon" size={34} />



                <div className="sg-feature-content">

                  <h3>{title}</h3>

                  <p>{description}</p>

                </div>



                <a

                  href="#how-it-works"

                  className="sg-feature-arrow"

                  aria-label={`Learn more about ${title}`}

                >

                  <ArrowRight size={19} />

                </a>

              </article>

            ))}

          </div>

        </section>



        {/* HOW IT WORKS */}

        <section

          className="sg-section sg-process"

          id="how-it-works"

        >

          <div className="sg-section-label">

            THE WORKFLOW

          </div>



          <h2>

            From incident report to coordinated insight

          </h2>



          <p className="sg-section-intro">

            A connected workflow bringing together security,

            document intelligence, compliance retrieval,

            and incident coordination.

          </p>



          <div className="sg-step-grid">

            {steps.map((step, index) => (

              <article className="sg-step" key={step.title}>

                <span>

                  {String(index + 1).padStart(2, "0")}

                </span>

                <h3>{step.title}</h3>

                <p>{step.description}</p>

              </article>

            ))}

          </div>

        </section>



        {/* ABOUT */}

        <section className="sg-about" id="about">

          <div>

            <div className="sg-section-label">

              BUILT FOR SAFER MARITIME OPERATIONS

            </div>



            <h2>

              Four agents.

              <br />

              One coordinated experience.

            </h2>



            <p>

              SeaGuard AI is a multi-agent prototype

              decision-support platform for maritime

              emergency, security, and incident management.

            </p>



            <p>

              The system helps authorized maritime personnel

              understand incidents, retrieve relevant

              procedures, assess potential risks, and

              review AI-assisted recommendations.

            </p>



            <p>

              SeaGuard AI does not replace approved vessel

              emergency procedures, qualified personnel,

              or the master's authority.

            </p>

          </div>



          <Link

            to="/login"

            className="sg-primary sg-large"

          >

            Access Your Workspace

            <ArrowRight size={18} />

          </Link>

        </section>

        {/* VISION AND MISSION */}
        <section className="sg-purpose" aria-label="Our vision and mission">
          <div className="sg-purpose-heading">
            <span className="sg-section-label">OUR PURPOSE</span>
            <h2>Smarter decisions. Safer seas.</h2>
            <p>Human-centered maritime intelligence supported by coordinated AI agents.</p>
          </div>
          <div className="sg-purpose-grid">
            <article className="sg-purpose-card">
              <span className="sg-purpose-icon"><Radar size={25} /></span>
              <h3>Our Vision</h3>
              <p>To support a safer and more informed maritime environment where crews and officers can access reliable, relevant guidance when it matters most.</p>
            </article>
            <article className="sg-purpose-card">
              <span className="sg-purpose-icon"><ShieldCheck size={25} /></span>
              <h3>Our Mission</h3>
              <p>To combine secure access, document understanding, regulatory retrieval, and coordinated incident assessment in a practical AI-assisted decision-support platform.</p>
            </article>
          </div>
        </section>

      </main>



            <section className="sg-contact" id="contact" aria-labelledby="sg-contact-title">
          <span className="sg-contact-eyebrow">GET IN TOUCH</span>
          <h2 id="sg-contact-title">Contact SeaGuard AI</h2>
          <p>Have a question about our maritime safety and compliance prototype? Reach out to our team.</p>
          <div className="sg-contact-grid">
            <div className="sg-contact-info-card">
              <h3>Email Us</h3>
              <a href="mailto:seaguardai123@gmail.com">seaguardai123@gmail.com</a>
            </div>
            <div className="sg-contact-info-card">
              <h3>Phone 1</h3>
              <span>+94 11 312 1234</span>
              
            </div>
            <div className="sg-contact-info-card">
              <h3>Phone 2</h3>
              <span>+94 11 223 5678</span>
              
            </div>
          </div>
        </section>

      {/* FOOTER */}

      <footer className="sg-footer">

        <div>

          <Anchor size={22} />

          SeaGuard AI

        </div>



        <span>

          Maritime Safety & Intelligence ·

          Prototype Decision-Support System

        </span>



        <span>

          © {new Date().getFullYear()} SeaGuard AI

        </span>

      </footer>



      {/* DEMO VIDEO MODAL */}

      {demoOpen && (

        <div

          className="sg-modal-backdrop"

          onClick={closeDemo}

          role="presentation"

        >

          <div

            className="sg-modal"

            role="dialog"

            aria-modal="true"

            aria-label="SeaGuard AI demonstration video"

            onClick={(event) => event.stopPropagation()}

          >

            <button

              type="button"

              className="sg-modal-close"

              onClick={closeDemo}

              aria-label="Close demo"

            >

              <X />

            </button>



            <h2>

              SeaGuard AI — System Demonstration

            </h2>



            <p>

              Discover how the four SeaGuard AI agents

              work together to support maritime

              incident management.

            </p>



            {!demoFailed ? (

              <video

                ref={demoVideoRef}

                controls

                autoPlay

                playsInline

                preload="metadata"

                poster="/images/seaguard-hero.png"

                src="/videos/seaguard-demo.mp4"

                onError={() => setDemoFailed(true)}

              >

                Your browser does not support video playback.

              </video>

            ) : (

              <div className="sg-demo-error" role="alert">

                <Play size={36} />

                <p>Demo video could not be loaded.</p>

                <p>Add your video to:</p>

                <code>

                  frontend/public/videos/seaguard-demo.mp4

                </code>

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}
