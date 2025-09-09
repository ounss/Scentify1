import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Sparkles,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";
import "../styles/Contact.css";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("🚀 Envoi du formulaire:", formData);

      const apiUrl =
        process.env.REACT_APP_API_URL ||
        "https://scentify-perfume.onrender.com/api";

      const response = await fetch(`${apiUrl}/contact/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("📡 Status de la réponse:", response.status);

      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let result = {};
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        try {
          result = await response.json();
        } catch (jsonError) {
          console.warn("⚠️ Réponse non-JSON mais status OK");
          result = { message: "Message envoyé avec succès" };
        }
      } else {
        result = { message: "Message envoyé avec succès" };
      }

      console.log("✅ Succès:", result);
      toast.success(result.message || "Message envoyé avec succès !");

      // Reset du formulaire
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("❌ Erreur formulaire:", err);
      toast.error(err.message || "Erreur lors de l'envoi du message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="contact">
      {/* Bandeau d'accent harmonisé avec Scentify */}
      <div className="contact-accent" aria-hidden="true" />

      {/* Hero Section modernisée */}
      <div className="contact-hero-modern">
        <div className="hero-decorations">
          <Sparkles className="hero-sparkles" />
          <Heart className="hero-heart" />
        </div>

        <div className="container">
          <header className="contact-hero">
            <h1 className="contact-title-modern">Contactez-nous</h1>
            <div className="title-accent-line"></div>
            <p className="contact-subtitle">
              Votre passion pour les parfums nous inspire. Partageons ensemble
              cette belle aventure olfactive.
            </p>
          </header>
        </div>
      </div>

      <div className="container">
        {/* Grid responsive harmonisée */}
        <div className="contact-grid">
          {/* Colonne informations */}
          <section className="contact-infos">
            {/* Card principale d'introduction */}
            <div className="card info-card modern-card">
              <div className="card-overlay"></div>
              <div className="card-content-modern">
                <div className="info-header-modern">
                  <div className="info-icon-modern">
                    <MessageCircle className="icon" />
                  </div>
                  <h2 className="info-title">Parlons parfums ensemble</h2>
                </div>
                <p className="info-text">
                  Notre passion pour l'univers olfactif nous pousse à vous
                  offrir la meilleure expérience possible. Partagez vos
                  découvertes, suggestions ou questions — nous vous lisons avec
                  attention !
                </p>
              </div>
            </div>

            {/* Stack des moyens de contact */}
            <div className="info-stack">
              <div className="card info-item modern-contact-card">
                <div className="card-overlay"></div>
                <div className="info-item-content">
                  <div
                    className="icon-pill icon-mail modern-icon"
                    aria-hidden="true"
                  >
                    <Mail className="icon" />
                  </div>
                  <div>
                    <h3 className="info-item-title">Email</h3>
                    <p className="info-item-text">
                      <a
                        className="footer-link"
                        href="mailto:contact@scentify.app"
                        aria-label="Nous envoyer un email"
                      >
                        contact@scentify.app
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="card info-item modern-contact-card">
                <div className="card-overlay"></div>
                <div className="info-item-content">
                  <div
                    className="icon-pill icon-phone modern-icon"
                    aria-hidden="true"
                  >
                    <Phone className="icon" />
                  </div>
                  <div>
                    <h3 className="info-item-title">Téléphone</h3>
                    <p className="info-item-text">
                      <a
                        href="tel:+3221234567"
                        className="footer-link"
                        aria-label="Nous appeler"
                      >
                        +32 2 123 45 67
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="card info-item modern-contact-card">
                <div className="card-overlay"></div>
                <div className="info-item-content">
                  <div
                    className="icon-pill icon-map modern-icon"
                    aria-hidden="true"
                  >
                    <MapPin className="icon" />
                  </div>
                  <div>
                    <h3 className="info-item-title">Adresse</h3>
                    <p className="info-item-text">Brussels, Belgium</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ rapide avec style moderne */}
            <div className="card faq-card modern-card">
              <div className="card-overlay"></div>
              <div className="faq-content-modern">
                <div className="faq-head">
                  <div className="faq-icon-modern">
                    <MessageCircle className="icon" aria-hidden="true" />
                  </div>
                  <h3 className="faq-title">Questions fréquentes</h3>
                </div>
                <div className="faq-body">
                  <div className="faq-item-modern">
                    <p className="faq-question">
                      <strong>Comment fonctionne la recommandation ?</strong>
                    </p>
                    <p className="faq-answer">
                      Nos algorithmes analysent les notes olfactives pour vous
                      proposer des parfums réellement similaires, au-delà des
                      associations marketing traditionnelles.
                    </p>
                  </div>
                  <div className="faq-item-modern">
                    <p className="faq-question">
                      <strong>
                        Puis-je acheter directement sur Scentify ?
                      </strong>
                    </p>
                    <p className="faq-answer">
                      Scentify privilégie la découverte et vous oriente vers nos
                      partenaires marchands sélectionnés pour finaliser vos
                      achats.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Colonne formulaire */}
          <section className="card contact-form modern-form">
            <div className="card-overlay"></div>
            <div className="form-content-modern">
              <header className="form-head">
                <h2 className="form-title">Envoyez-nous un message</h2>
                <p className="form-subtitle">
                  Nous vous répondrons dans les plus brefs délais.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">
                      Nom complet *
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="form-input modern-input"
                      autoComplete="name"
                      placeholder="Votre nom complet"
                      aria-describedby="name-error"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="form-input modern-input"
                      autoComplete="email"
                      placeholder="votre@email.com"
                      aria-describedby="email-error"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="subject">
                    Sujet *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="form-select modern-input"
                    aria-describedby="subject-error"
                  >
                    <option value="">Choisissez un sujet</option>
                    <option value="question">Question générale</option>
                    <option value="parfum">Question sur un parfum</option>
                    <option value="suggestion">
                      Suggestion d'amélioration
                    </option>
                    <option value="bug">Signaler un problème technique</option>
                    <option value="partenariat">
                      Proposition de partenariat
                    </option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="message">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Décrivez votre demande en détail… Plus vous serez précis, mieux nous pourrons vous aider !"
                    className="form-textarea modern-input"
                    aria-describedby="message-error"
                    minLength={10}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="contact-submit modern-submit"
                  aria-busy={isLoading}
                  aria-describedby={isLoading ? "submit-status" : undefined}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner"
                        aria-label="Envoi en cours"
                        id="submit-status"
                      />
                      <span>Envoi en cours…</span>
                    </>
                  ) : (
                    <>
                      <Send className="svg" aria-hidden="true" />
                      <span>Envoyer le message</span>
                    </>
                  )}
                </button>

                <p className="form-note">
                  En envoyant ce message, vous acceptez que nous utilisions vos
                  données pour vous répondre. Consultez notre{" "}
                  <a href="/privacy" className="footer-link">
                    politique de confidentialité
                  </a>
                  .
                </p>
              </form>
            </div>
          </section>
        </div>

        {/* Section moderne : Pourquoi nous choisir */}
        <section className="contact-values">
          <div className="values-header">
            <h3 className="values-title">Pourquoi nous choisir ?</h3>
            <p className="values-subtitle">
              Découvrez ce qui fait de Scentify votre compagnon idéal dans
              l'univers des parfums.
            </p>
          </div>

          <div className="values-grid">
            <div className="value-item">
              <div className="value-emoji">🧪</div>
              <h4 className="value-title">Expertise olfactive</h4>
              <p className="value-description">
                Nos algorithmes analysent plus de 3000 notes pour des
                recommandations précises.
              </p>
            </div>
            <div className="value-item">
              <div className="value-emoji">❤️</div>
              <h4 className="value-title">Communauté passionnée</h4>
              <p className="value-description">
                Rejoignez des milliers d'amateurs de parfums qui partagent leurs
                découvertes.
              </p>
            </div>
            <div className="value-item">
              <div className="value-emoji">✨</div>
              <h4 className="value-title">Innovation continue</h4>
              <p className="value-description">
                Nous améliorons constamment notre plateforme grâce à vos
                retours.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
