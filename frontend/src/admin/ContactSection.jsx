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
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const ContactSection = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  // Charger les messages
  const loadMessages = async () => {
    try {
      const response = await api.get("/contact");
      const data = response.data;
      setMessages(data);

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Ouvrir un message
  const openMessage = (message) => {
    setSelectedMessage(message);
    setAdminNote(message.adminNote || "");
    setShowModal(true);

    // Marquer comme lu si nouveau
    if (message.status === "nouveau") {
      updateMessageStatus(message._id, "lu");
    }
  };

  // Mettre à jour le statut
  const updateMessageStatus = async (messageId, status, note = null) => {
    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status,
          ...(note !== null && { adminNote: note }),
        }),
      });

      if (response.ok) {
        const updatedMessage = await response.json();

        // Mettre à jour la liste
        setMessages(
          messages.map((m) => (m._id === messageId ? updatedMessage : m))
        );

        // Mettre à jour le message sélectionné
        if (selectedMessage?._id === messageId) {
          setSelectedMessage(updatedMessage);
        }

        toast.success("Message mis à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Sauvegarder la note
  const saveNote = async () => {
    if (!selectedMessage) return;

    await updateMessageStatus(
      selectedMessage._id,
      selectedMessage.status,
      adminNote
    );
    setShowModal(false);
  };

  // Composant badge de statut
  const StatusBadge = ({ status }) => {
    const configs = {
      nouveau: {
        color: "bg-red-100 text-red-800",
        icon: AlertCircle,
        label: "Nouveau",
      },
      lu: { color: "bg-blue-100 text-blue-800", icon: Eye, label: "Lu" },
      traite: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Traité",
      },
    };

    const config = configs[status] || configs.nouveau;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Chargement des messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Messages de contact
          </h2>
          <p className="text-sm text-gray-600">{messages.length} message(s)</p>
        </div>
        <button
          onClick={loadMessages}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Nouveaux</p>
              <p className="text-xl font-bold">
                {messages.filter((m) => m.status === "nouveau").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Lus</p>
              <p className="text-xl font-bold">
                {messages.filter((m) => m.status === "lu").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Traités</p>
              <p className="text-xl font-bold">
                {messages.filter((m) => m.status === "traite").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="bg-white shadow-lg rounded-xl border">
        {messages.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div
                key={message._id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => openMessage(message)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {message.name}
                        </span>
                      </div>
                      <StatusBadge status={message.status} />
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {message.email}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(message.createdAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>

                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {message.subject}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {message.message.length > 100
                        ? `${message.message.substring(0, 100)}...`
                        : message.message}
                    </p>
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucun message
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Les messages de contact apparaîtront ici.
            </p>
          </div>
        )}
      </div>

      {/* Modal détail du message */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* En-tête */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détail du message
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fermer</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Informations du message */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">
                    {selectedMessage.subject}
                  </h4>
                  <StatusBadge status={selectedMessage.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">De:</span>
                    <p className="text-gray-900">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900">{selectedMessage.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <p className="text-gray-900">
                      {new Date(selectedMessage.createdAt).toLocaleString(
                        "fr-FR"
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Statut:</span>
                    <select
                      value={selectedMessage.status}
                      onChange={(e) =>
                        updateMessageStatus(selectedMessage._id, e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="nouveau">Nouveau</option>
                      <option value="lu">Lu</option>
                      <option value="traite">Traité</option>
                    </select>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Message:</span>
                  <div className="mt-2 p-3 bg-gray-50 rounded border">
                    <p className="text-gray-900 whitespace-pre-line">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Note admin */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note administrative (privée)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ajouter une note interne..."
                  />
                </div>

                <div className="flex justify-between items-center">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Répondre par email
                  </a>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={saveNote}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactSection;

// ===============================================================
// Instructions d'intégration dans AdminPanel.jsx existant :
// ===============================================================

/*
1. Importer le composant :
   import ContactSection from "../components/admin/ContactSection";

2. Ajouter un onglet "Contact" dans la navigation :
   Dans le state des onglets, ajouter :
   { id: "contact", name: "Contact", icon: MessageSquare }

3. Ajouter le cas dans le switch pour afficher la section :
   case "contact":
     return <ContactSection />;
*/
