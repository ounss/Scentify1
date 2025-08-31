import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function Contact() {
  // Dans Contact.jsx, assure-toi que formData contient :
  const [formData, setFormData] = useState({
    name: "", // pas "nom"
    email: "",
    subject: "", // pas "sujet"
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Remplacer le mock par l'appel API réel
      const response = await fetch("/api/contact/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de l'envoi");
      }

      toast.success("Message envoyé avec succès !");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'envoi du message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="contact">
      {/* Bandeau d’accent */}
      <div className="contact-accent" aria-hidden="true" />

      <div className="container">
        {/* Header / Hero */}
        <header className="contact-hero text-center mb-6">
          <h1 className="contact-title">Contactez-nous</h1>
          <p className="contact-subtitle">
            Une question sur un parfum ? Une suggestion ? L’équipe Scentify vous
            accompagne dans votre découverte olfactive.
          </p>
        </header>

        {/* Grid principale */}
        <div className="contact-grid">
          {/* Colonne infos */}
          <section className="contact-infos">
            <div className="card info-card">
              <h2 className="info-title">Parlons parfums</h2>
              <p className="info-text">
                Notre passion pour l’univers olfactif nous pousse à vous offrir
                la meilleure expérience possible. Partagez vos découvertes,
                suggestions ou questions — on vous lit !
              </p>
            </div>

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
                  <p className="info-item-text">+32 2 123 45 67</p>
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

            {/* FAQ rapide */}
            <div className="card faq-card">
              <div className="faq-head">
                <MessageCircle className="icon" />
                <h3 className="faq-title">Questions fréquentes</h3>
              </div>
              <div className="faq-body">
                <p>
                  <strong>Comment fonctionne la recommandation ?</strong>
                  <br />
                  Nos algorithmes analysent les notes olfactives pour vous
                  proposer des parfums similaires.
                </p>
                <p>
                  <strong>Puis-je acheter directement ?</strong>
                  <br />
                  Scentify vous oriente vers des partenaires marchands
                  sélectionnés.
                </p>
              </div>
            </div>
          </section>

          {/* Colonne formulaire */}
          <section className="card contact-form">
            <header className="form-head text-center">
              <h2 className="form-title">Envoyez-nous un message</h2>
              <p className="form-subtitle">
                Nous vous répondrons dans les plus brefs délais.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-2 gap-4">
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
                >
                  <option value="">Choisissez un sujet</option>
                  <option value="question">Question générale</option>
                  <option value="parfum">Question sur un parfum</option>
                  <option value="suggestion">Suggestion d'amélioration</option>
                  <option value="bug">Signaler un problème</option>
                  <option value="partenariat">Partenariat</option>
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
                  placeholder="Décrivez votre demande en détail…"
                  className="form-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full contact-submit"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className="spinner" aria-label="Envoi en cours…" />
                ) : (
                  <>
                    <Send className="btn-icon svg" />
                    <span>Envoyer le message</span>
                  </>
                )}
              </button>

              <p className="form-note">
                En envoyant ce message, vous acceptez que nous utilisions vos
                données pour vous répondre.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
