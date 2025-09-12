// frontend/src/components/admin/ContactSection.jsx
import React, { useState, useEffect } from "react";
import {
  Mail,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Search,
  X,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import styles from "../styles/AdminPanel.module.css";

const ContactSection = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");

  const loadMessages = async () => {
    try {
      const response = await api.get("/contact");
      setMessages(response.data);
    } catch (error) {
      console.error("Erreur chargement messages:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const openMessage = (message) => {
    setSelectedMessage(message);
    setAdminNote(message.adminNote || "");
    setShowModal(true);

    if (message.status === "nouveau") {
      updateMessageStatus(message._id, "lu");
    }
  };

  // ✅ CORRECTION PRINCIPALE : Utiliser l'instance api au lieu de fetch
  const updateMessageStatus = async (messageId, status, note = null) => {
    try {
      const updateData = { status };
      if (note !== null) {
        updateData.adminNote = note;
      }

      // ✅ Utiliser api.patch au lieu de fetch
      const response = await api.patch(`/contact/${messageId}`, updateData);

      const updatedMessage = response.data;

      // Mettre à jour l'état local
      setMessages((prevMessages) =>
        prevMessages.map((m) => (m._id === messageId ? updatedMessage : m))
      );

      // Mettre à jour le message sélectionné si c'est le même
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(updatedMessage);
      }

      toast.success("Message mis à jour");
    } catch (error) {
      console.error("Erreur mise à jour message:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const saveNote = async () => {
    if (!selectedMessage) return;
    await updateMessageStatus(
      selectedMessage._id,
      selectedMessage.status,
      adminNote
    );
    setShowModal(false);
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      nouveau: {
        className: "admin-badge-danger",
        icon: AlertCircle,
        label: "Nouveau",
      },
      lu: {
        className: "admin-badge-info",
        icon: Eye,
        label: "Lu",
      },
      traite: {
        className: "admin-badge-success",
        icon: CheckCircle,
        label: "Traité",
      },
    };

    const config = configs[status] || configs.nouveau;
    const Icon = config.icon;

    return (
      <span className={`admin-badge ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Filtrer les messages
  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "tous" || message.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className={styles.main}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.content}>
        {/* En-tête de section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionMeta}>
              <div className={styles.sectionIconWrapper}>
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Messages de contact</h2>
                <p className={styles.sectionSubtitle}>
                  Gérez les messages des utilisateurs •{" "}
                  {filteredMessages.length} message(s)
                </p>
              </div>
            </div>
            <div className={styles.sectionActions}>
              <button
                onClick={loadMessages}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className={styles.searchBar}>
              <div className={styles.searchIcon}>
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, email ou sujet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="tous">Tous les statuts</option>
              <option value="nouveau">Nouveaux</option>
              <option value="lu">Lus</option>
              <option value="traite">Traités</option>
            </select>
          </div>

          {/* Statistiques */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statUsers}`}>
              <div className={styles.statContent}>
                <div className={styles.statMeta}>
                  <p className={styles.statLabel}>Nouveaux</p>
                  <p className={styles.statValue}>
                    {messages.filter((m) => m.status === "nouveau").length}
                  </p>
                  <p className={styles.statDetail}>Messages non lus</p>
                </div>
                <div className={styles.statIcon}>
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statParfums}`}>
              <div className={styles.statContent}>
                <div className={styles.statMeta}>
                  <p className={styles.statLabel}>Lus</p>
                  <p className={styles.statValue}>
                    {messages.filter((m) => m.status === "lu").length}
                  </p>
                  <p className={styles.statDetail}>En attente de traitement</p>
                </div>
                <div className={styles.statIcon}>
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statNotes}`}>
              <div className={styles.statContent}>
                <div className={styles.statMeta}>
                  <p className={styles.statLabel}>Traités</p>
                  <p className={styles.statValue}>
                    {messages.filter((m) => m.status === "traite").length}
                  </p>
                  <p className={styles.statDetail}>Messages résolus</p>
                </div>
                <div className={styles.statIcon}>
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Liste des messages */}
          <div className={styles.tableContainer}>
            {filteredMessages.length > 0 ? (
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div className="grid grid-cols-12 gap-4 px-6 py-4">
                    <div className="col-span-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Expéditeur
                    </div>
                    <div className="col-span-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Sujet
                    </div>
                    <div className="col-span-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Date
                    </div>
                    <div className="col-span-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Statut
                    </div>
                    <div className="col-span-1 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Action
                    </div>
                  </div>
                </div>
                <div className={styles.tableBody}>
                  {filteredMessages.map((message) => (
                    <div
                      key={message._id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                      onClick={() => openMessage(message)}
                    >
                      <div className="col-span-3">
                        <div className={styles.userInfo}>
                          <div className={styles.avatar}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className={styles.userDetails}>
                            <p className={styles.userName}>{message.name}</p>
                            <p className={styles.userEmail}>{message.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <p className="font-medium text-gray-900 mb-1">
                          {message.subject}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {message.message.length > 80
                            ? `${message.message.substring(0, 80)}...`
                            : message.message}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className={styles.dateText}>
                          {new Date(message.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <StatusBadge status={message.status} />
                      </div>
                      <div className="col-span-1">
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <MessageSquare className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun message
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "tous"
                    ? "Aucun message ne correspond à vos critères"
                    : "Les messages de contact apparaîtront ici"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal détail du message */}
        {showModal && selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    Détail du message
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* En-tête du message */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedMessage.subject}
                    </h4>
                    <StatusBadge status={selectedMessage.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-500">De:</span>
                        <p className="font-medium text-gray-900">
                          {selectedMessage.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium text-gray-900">
                          {selectedMessage.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedMessage.createdAt).toLocaleString(
                            "fr-FR"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenu du message */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Message
                  </label>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-line leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>

                {/* Changement de statut */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Statut du message
                  </label>
                  <select
                    value={selectedMessage.status}
                    onChange={(e) =>
                      updateMessageStatus(selectedMessage._id, e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="nouveau">Nouveau</option>
                    <option value="lu">Lu</option>
                    <option value="traite">Traité</option>
                  </select>
                </div>

                {/* Note administrative */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Note administrative (privée)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ajouter une note interne pour ce message..."
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md"
                  >
                    <Mail className="w-4 h-4" />
                    Répondre par email
                  </a>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={saveNote}
                      className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactSection;
