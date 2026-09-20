import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import doctor from "../../assets/images/lp.jpeg";
import logo from "../../assets/images/logo.jpeg";

function LandingPage() {

    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("home");
    const scrollToSection = (event, id) => {
        event.preventDefault();
        setActiveSection(id);
        const container = document.querySelector(".landingContainer");
        const target = document.getElementById(id);
        if (container && target) {
            if (id === "contact") {
                container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
            } else {
                container.scrollTo({ top: Math.max(0, target.offsetTop - 90), behavior: "smooth" });
            }
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.12 });
        document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
        const container = document.querySelector(".landingContainer");
        const sections = [...document.querySelectorAll("#home, #about, #features, #contact")];
        const updateActiveSection = () => {
            const scrollPosition = (container?.scrollTop || 0) + 125;
            const current = sections.filter((section) => section.offsetTop <= scrollPosition).at(-1);
            if (current) setActiveSection(current.id);
        };
        container?.addEventListener("scroll", updateActiveSection, { passive: true });
        updateActiveSection();
        return () => { observer.disconnect(); container?.removeEventListener("scroll", updateActiveSection); };
    }, []);

    return (

        <div className="landingContainer">

            {/* ===================== NAVBAR ===================== */}

            <nav className="landing-navbar">

                <div className="logoSection">

                    <img
                        src={logo}
                        alt="HealthSync Logo"
                        className="logo"
                    />

                    <div>

                        <h2>HealthSync</h2>

                        <p>Healthy Records, Stronger Lives</p>

                    </div>

                </div>

                <ul className="navLinks">

                    <li>
                        <a className={activeSection === "home" ? "active" : ""} href="#home" onClick={(event) => scrollToSection(event, "home")}>Home</a>
                    </li>

                    <li>
                        <a className={activeSection === "about" ? "active" : ""} href="#about" onClick={(event) => scrollToSection(event, "about")}>About</a>
                    </li>

                    <li>
                        <a className={activeSection === "features" ? "active" : ""} href="#features" onClick={(event) => scrollToSection(event, "features")}>Features</a>
                    </li>

                    <li>
                        <a className={activeSection === "contact" ? "active" : ""} href="#contact" onClick={(event) => scrollToSection(event, "contact")}>Contact</a>
                    </li>

                </ul>

                <button
                    className="getStartedBtn"
                    onClick={() => navigate("/login")}
                >
                    Get Started
                </button>

            </nav>

            {/* ===================== HOME ===================== */}

            <section
                id="home"
                className="heroSection reveal"
            >

                <div className="heroLeft">

                    <h1>

                        Digital Health Records

                        <span> for Migrant Workers</span>

                    </h1>

                    <p>

                        HealthSync helps doctors, organizations and migrant
                        workers manage digital health records securely using
                        QR technology, AI-powered analytics and cloud storage.

                    </p>

                    <button
                        className="heroButton"
                        onClick={() => navigate("/login")}
                    >
                        Get Started →
                    </button>

                </div>

                <div className="heroRight">

                    <img
                        src={doctor}
                        alt="Doctor"
                    />

                </div>

            </section>

            {/* ===================== ABOUT ===================== */}

            <section
                id="about"
                className="aboutSection reveal"
            >

                <h2>

                    About HealthSync

                </h2>

                <p>

                    HealthSync is a smart healthcare management platform
                    developed especially for migrant workers.

                </p>

                <p>

                    Doctors can maintain health records, generate prescriptions,
                    create QR codes, monitor worker health and predict disease
                    risks using Artificial Intelligence.

                </p>

                <div className="aboutCards">

                    <div className="aboutCard reveal">

                        <h3>Mission</h3>

                        <p>

                            Deliver secure and affordable digital healthcare
                            for every migrant worker.

                        </p>

                    </div>

                    <div className="aboutCard reveal">

                        <h3>Vision</h3>

                        <p>

                            Improve worker health through digital innovation
                            and AI-powered healthcare solutions.

                        </p>

                    </div>

                    <div className="aboutCard reveal">

                        <h3>Security</h3>

                        <p>

                            All health records are securely stored with
                            authenticated access and QR verification.

                        </p>

                    </div>

                </div>

            </section>

            {/* ===================== FEATURES ===================== */}

            <section
                id="features"
                className="featuresSection reveal"
            >

                <h2>

                    Our Features

                </h2>

                <div className="featureGrid">

                    <div className="featureCard reveal">

                        <h3>

                            📋 Digital Health Records

                        </h3>

                        <p>

                            Doctors record vital signs, diagnoses, and
                            treatment plans for every worker.

                        </p>

                    </div>

                    <div className="featureCard reveal">

                        <h3>

                            📱 QR Based Access

                        </h3>

                        <p>

                            Generate and download worker QR codes for secure
                            access to verified health information.

                        </p>

                    </div>

                    <div className="featureCard reveal">

                        <h3>

                            🤖 AI Risk Prediction

                        </h3>

                        <p>

                            Doctors receive Low, Medium, or High preventive
                            risk suggestions from health indicators.

                        </p>

                    </div>

                    <div className="featureCard reveal">

                        <h3>

                            💊 Smart Prescriptions

                        </h3>

                        <p>

                            Create prescriptions and check interactions
                            across two or more medicines.

                        </p>

                    </div>

                    <div className="featureCard reveal">

                        <h3>

                            📈 Analytics Dashboard

                        </h3>

                        <p>

                            Admin, Doctor, and Worker dashboards show the
                            right information for each role.

                        </p>

                    </div>

                    <div className="featureCard reveal">

                        <h3>

                            ☁ Cloud Storage

                        </h3>

                        <p>

                            Workers book appointments; doctors confirm or
                            cancel requests with status notifications.

                        </p>

                    </div>

                </div>

            </section>

            {/* ===================== CONTACT ===================== */}

            <section
                id="contact"
                className="contactSection reveal"
            >

                <h2>

                    Contact Us

                </h2>

                <div className="contactContainer">

                    <div className="contactBox">

                        <h3>Email</h3>

                        <p>

                            healthsyncproject3502@gmail.com

                        </p>

                    </div>

                    <div className="contactBox">

                        <h3>Phone</h3>

                        <p>

                            +91 9876543210

                        </p>

                    </div>

                    <div className="contactBox">

                        <h3>Address</h3>

                        <p>

                            Chennai, Tamil Nadu,
                            India

                        </p>

                    </div>

                </div>

            </section>

            {/* ===================== FOOTER ===================== */}

            <footer>

                <div className="footerLogo">

                    <h2>

                        HealthSync

                    </h2>

                    <p>

                        Healthy Records, Stronger Lives

                    </p>

                </div>

                <p className="footer-contact">Contact: healthsyncproject3502@gmail.com · +91 9876543210</p>

                <p className="copyright">

                    © 2026 HealthSync. All Rights Reserved.

                </p>

            </footer>

        </div>

    );

}

export default LandingPage;
