import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

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

      <div className="container">
        {/* Hero section avec typographie The Seasons */}
        <header className="contact-hero">
          <h1 className="contact-title">Contactez-nous</h1>
          <p className="contact-subtitle">
            Une question sur un parfum ? Une suggestion ? L'équipe Scentify vous
            accompagne dans votre découverte olfactive.
          </p>
        </header>

        {/* Grid responsive harmonisée */}
        <div className="contact-grid">
          {/* Colonne informations */}
          <section className="contact-infos">
            {/* Card principale d'introduction */}
            <div className="card info-card">
              <h2 className="info-title">Parlons parfums</h2>
              <p className="info-text">
                Notre passion pour l'univers olfactif nous pousse à vous offrir
                la meilleure expérience possible. Partagez vos découvertes,
                suggestions ou questions — nous vous lisons avec attention !
              </p>
            </div>

            {/* Stack des moyens de contact */}
            <div className="info-stack">
              <div className="card info-item">
                <div className="icon-pill icon-mail" aria-hidden="true">
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

              <div className="card info-item">
                <div className="icon-pill icon-phone" aria-hidden="true">
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

              <div className="card info-item">
                <div className="icon-pill icon-map" aria-hidden="true">
                  <MapPin className="icon" />
                </div>
                <div>
                  <h3 className="info-item-title">Adresse</h3>
                  <p className="info-item-text">Brussels, Belgium</p>
                </div>
              </div>
            </div>

            {/* FAQ rapide avec style Scentify */}
            <div className="card faq-card">
              <div className="faq-head">
                <MessageCircle className="icon" aria-hidden="true" />
                <h3 className="faq-title">Questions fréquentes</h3>
              </div>
              <div className="faq-body">
                <div>
                  <p>
                    <strong>Comment fonctionne la recommandation ?</strong>
                  </p>
                  <p>
                    Nos algorithmes analysent les notes olfactives pour vous
                    proposer des parfums réellement similaires, au-delà des
                    associations marketing traditionnelles.
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Puis-je acheter directement sur Scentify ?</strong>
                  </p>
                  <p>
                    Scentify privilégie la découverte et vous oriente vers nos
                    partenaires marchands sélectionnés pour finaliser vos
                    achats.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Colonne formulaire */}
          <section className="card contact-form">
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
                    className="form-input"
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
                    className="form-input"
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
                  className="form-select"
                  aria-describedby="subject-error"
                >
                  <option value="">Choisissez un sujet</option>
                  <option value="question">Question générale</option>
                  <option value="parfum">Question sur un parfum</option>
                  <option value="suggestion">Suggestion d'amélioration</option>
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
                  className="form-textarea"
                  aria-describedby="message-error"
                  minLength={10}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="contact-submit"
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
          </section>
        </div>
      </div>
    </main>
  );
}
