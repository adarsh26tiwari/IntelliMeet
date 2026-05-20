import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants";
import WelcomeSection from "../components/dashboard/WelcomeSection";
import ActionCard from "../components/dashboard/ActionCard";
import FeaturesGrid from "../components/dashboard/FeaturesGrid";
import SessionList from "../components/dashboard/SessionList";
import { useSession } from "../context/sessionContext.jsx";
import { FaExclamationCircle } from "react-icons/fa";

const Dashboard = () => {
  const { user } = useAuth();
  const { createSession, listSessions, error, loading } = useSession();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const handleCreateSession = async () => {
    setCreating(true);
    const result = await createSession();
    if (result.success) {
      navigate(`${ROUTES.HOST}?roomId=${result.session.roomId}`);
    }
    setCreating(false);
  };

  useEffect(() => {
    const load = async () => {
      const result = await listSessions(statusFilter);
      if (result.success) {
        setSessions(result.sessions);
      }
    };
    load();
  }, [listSessions, statusFilter]);

  const handleRejoinSession = (session) => {
    if (session.status === "active") {
      if (session.isHost) {
        navigate(`${ROUTES.HOST}?roomId=${session.roomId}`);
      } else {
        navigate(`${ROUTES.JOIN}?roomId=${session.roomId}`);
      }
    }
  };

  const handleJoinSession = () => {
    navigate(ROUTES.JOIN);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <WelcomeSection userName={user?.name} />

        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border-1-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm ">
              <div className="flex items-center">
                <FaExclamationCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        <ActionCard
          onCreateSession={handleCreateSession}
          onJoinSession={handleJoinSession}
          creating={creating}
        />

        <FeaturesGrid />

        <SessionList
          sessions={sessions}
          loading={loading}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          onRejoinSession={handleRejoinSession}
        />
      </main>
    </div>
  );
};

export default Dashboard;