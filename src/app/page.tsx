'use client';

import { useState, useCallback } from 'react';
import { TabId, MatchFormData, MatchStatus, Scorer } from '@/types/tournament';
import { useTournament } from '@/hooks/useTournament';
import TabNavigation from '@/components/TabNavigation';
import Klasemen from '@/components/Klasemen';
import Jadwal from '@/components/Jadwal';
import TopSkor from '@/components/TopSkor';
import PlayerManagement from '@/components/PlayerManagement';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import OfflineIndicator from '@/components/OfflineIndicator';
import DataManagement from '@/components/DataManagement';
import AdminPanel from '@/components/AdminPanel';

export default function Home() {
  const {
    teams,
    matches,
    displayMatches,
    playerNamesByTeam,
    submitMatch,
    deleteMatch,
    getStandings,
    exportData,
    importData,
    resetAll,
    addTeam,
    editTeam,
    removeTeam,
    regenerateMatches,
    addPlayer,
    editPlayer,
    removePlayer,
    updateMatchDate,
    isLoaded,
  } = useTournament();

  const [activeTab, setActiveTab] = useState<TabId>('klasemen');
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);

  // Direct submit from Jadwal MatchCard inline form
  const handleJadwalSubmit = useCallback(
    (matchId: string, scoreHome: number, scoreAway: number, status: MatchStatus, scorers: Scorer[]) => {
      const match = displayMatches.find((m) => m.id === matchId);
      if (!match) return;
      const data: MatchFormData = {
        group: match.group,
        teamHomeId: match.teamHomeId,
        teamAwayId: match.teamAwayId,
        scoreHome,
        scoreAway,
        status,
        scorers,
      };
      const result = submitMatch(matchId, data);
      if (result.success) {
        setToast({ message: 'Hasil disimpan', type: 'success' });
      } else {
        setToast({ message: result.error ?? 'Gagal menyimpan', type: 'error' });
      }
    },
    [displayMatches, submitMatch]
  );

  // Delete flow: show confirmation dialog
  const handleDeleteRequest = useCallback((matchId: string) => {
    setDeleteMatchId(matchId);
  }, []);

  // Confirm delete
  const handleDeleteConfirm = useCallback(() => {
    if (deleteMatchId) {
      deleteMatch(deleteMatchId);
      setToast({ message: 'Pertandingan berhasil dihapus', type: 'success' });
      setDeleteMatchId(null);
    }
  }, [deleteMatchId, deleteMatch]);

  // Cancel delete
  const handleDeleteCancel = useCallback(() => {
    setDeleteMatchId(null);
  }, []);

  // Data management: Export
  const handleExport = useCallback(() => {
    exportData();
    setToast({ message: 'Data berhasil di-export', type: 'success' });
  }, [exportData]);

  // Data management: Import (with confirmation)
  const handleImportRequest = useCallback(
    async (file: File): Promise<{ success: boolean; error?: string }> => {
      setPendingImportFile(file);
      setShowImportConfirm(true);
      // Return success here as the actual import happens on confirm
      return { success: true };
    },
    []
  );

  const handleImportConfirm = useCallback(async () => {
    setShowImportConfirm(false);
    if (!pendingImportFile) return;

    const result = await importData(pendingImportFile);
    if (result.success) {
      setToast({ message: 'Data berhasil di-import', type: 'success' });
    } else {
      setToast({ message: !result.success ? result.error : 'Gagal import data', type: 'error' });
    }
    setPendingImportFile(null);
  }, [pendingImportFile, importData]);

  const handleImportCancel = useCallback(() => {
    setShowImportConfirm(false);
    setPendingImportFile(null);
  }, []);

  // Data management: Reset (with confirmation)
  const handleResetRequest = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    resetAll();
    setShowResetConfirm(false);
    setToast({ message: 'Semua data pertandingan berhasil direset', type: 'success' });
  }, [resetAll]);

  const handleResetCancel = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  // Loading state
  if (!isLoaded) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-gray-600 text-lg">Memuat...</p>
      </main>
    );
  }

  return (
    <>
      <OfflineIndicator />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        open={deleteMatchId !== null}
        title="Hapus Pertandingan"
        message="Apakah Anda yakin ingin menghapus hasil pertandingan ini? Skor dan pencetak gol akan direset."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ConfirmDialog
        open={showImportConfirm}
        title="Import Data"
        message="Import akan menimpa semua data yang ada saat ini. Apakah Anda yakin ingin melanjutkan?"
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset Semua Data"
        message="Semua skor pertandingan, pencetak gol, dan status akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?"
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
      />

      <main className="min-h-screen pb-20 md:pb-4">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-2xl font-bold text-center mb-4">Copa Sawo Jajar</h1>

          {/* Desktop tab navigation (top) */}
          <div className="hidden md:block mb-4">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Tab content */}
          <div
            id="tabpanel-klasemen"
            role="tabpanel"
            aria-labelledby="tab-klasemen"
            hidden={activeTab !== 'klasemen'}
          >
            {activeTab === 'klasemen' && (
              <Klasemen
                standingsA={getStandings('A')}
                standingsB={getStandings('B')}
              />
            )}
          </div>

          <div
            id="tabpanel-jadwal"
            role="tabpanel"
            aria-labelledby="tab-jadwal"
            hidden={activeTab !== 'jadwal'}
          >
            {activeTab === 'jadwal' && (
              <Jadwal
                matches={displayMatches}
                teams={teams}
                playerNamesByTeam={playerNamesByTeam}
                onSubmit={handleJadwalSubmit}
                onDelete={handleDeleteRequest}
              />
            )}
          </div>

          <div
            id="tabpanel-input"
            role="tabpanel"
            aria-labelledby="tab-input"
            hidden={activeTab !== 'input'}
          >
            {activeTab === 'input' && (
              <PlayerManagement
                teams={teams}
                playerNamesByTeam={playerNamesByTeam}
                onAddPlayer={addPlayer}
                onEditPlayer={editPlayer}
                onRemovePlayer={removePlayer}
              />
            )}
          </div>

          <div
            id="tabpanel-topskor"
            role="tabpanel"
            aria-labelledby="tab-topskor"
            hidden={activeTab !== 'topskor'}
          >
            {activeTab === 'topskor' && (
              <TopSkor matches={matches} teams={teams} />
            )}
          </div>

          <div
            id="tabpanel-admin"
            role="tabpanel"
            aria-labelledby="tab-admin"
            hidden={activeTab !== 'admin'}
          >
            {activeTab === 'admin' && (
              <AdminPanel
                teams={teams}
                matches={displayMatches}
                onAddTeam={addTeam}
                onEditTeam={editTeam}
                onRemoveTeam={removeTeam}
                onRegenerateMatches={regenerateMatches}
                onUpdateMatchDate={updateMatchDate}
              />
            )}
          </div>

          {/* Data Management Section */}
          <DataManagement
            onExport={handleExport}
            onImport={handleImportRequest}
            onReset={handleResetRequest}
          />
        </div>

        {/* Mobile tab navigation (bottom) */}
        <div className="md:hidden">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </main>
    </>
  );
}
