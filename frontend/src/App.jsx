import React, { useState, useEffect } from 'react';
import './styles/meetior.css';
import { API, getAuthToken } from './services/api.js';
import { Navbar, DemoShortcutBar, WalletModal, TicketPassModal } from './components';
import {
  HomePage,
  BrowsePage,
  EventDetailsPage,
  CreateEventPage,
  RegisterPage,
  LoginPage,
  AdminLoginPage,
  BookingsPage,
  SavedEventsPage,
  DemandsPage,
  ScannerPage,
  NotificationsPage,
  ProfilePage,
  AdminDashboardPage,
  MyEventsPage,
  RevenuePage
} from './pages';

/**
 * Meetior Main Application Container
 * Handles view routing, global authentication session, and modals.
 */
export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(5000);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Flash toast notification
  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), duration);
  };

  // View navigation handler with role safeguards
  const navigateTo = (viewName) => {
    // Feature toggle: Admin panel protection
    if (viewName === 'admin' && (!currentUser || currentUser.role !== 'Admin')) {
      showToast('🔒 System Administrator credentials required.');
      setCurrentView('admin-login');
      return;
    }

    if ((viewName === 'scanner' || viewName === 'create' || viewName === 'revenue' || viewName === 'my-events') && (!currentUser || currentUser.role !== 'Organizer')) {
      showToast('⚠️ Organizer login required.');
      setCurrentView('login');
      return;
    }

    if ((viewName === 'profile' || viewName === 'bookings' || viewName === 'saved' || viewName === 'notifications') && !currentUser) {
      showToast('Please log in to continue.');
      setCurrentView('login');
      return;
    }

    setCurrentView(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load session on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      API.getMe()
        .then((res) => {
          if (res?.user) setCurrentUser(res.user);
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('meetior_token');
        });
    }

    // Load demo wallet balance
    const savedBal = localStorage.getItem('meetior_demo_wallet_balance');
    if (savedBal !== null) {
      setWalletBalance(parseFloat(savedBal) || 0);
    }
  }, []);

  return (
    <div className="meetior-app-wrapper">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="sketch-toast show" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
          {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        navigateTo={navigateTo}
        onOpenWallet={() => setWalletModalOpen(true)}
      />

      <main className="main-stage">
        {/* Quick Demo Preview Pills */}
        <DemoShortcutBar
          currentView={currentView}
          navigateTo={navigateTo}
          currentUser={currentUser}
        />

        {/* View Page Components */}
        {currentView === 'home' && <HomePage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'browse' && <BrowsePage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'details' && <EventDetailsPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'create' && <CreateEventPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'register' && <RegisterPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'login' && <LoginPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'admin-login' && <AdminLoginPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'bookings' && <BookingsPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'saved' && <SavedEventsPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'demands' && <DemandsPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'scanner' && <ScannerPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'notifications' && <NotificationsPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'profile' && <ProfilePage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'admin' && <AdminDashboardPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'my-events' && <MyEventsPage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
        {currentView === 'revenue' && <RevenuePage navigateTo={navigateTo} currentUser={currentUser} showToast={showToast} />}
      </main>

      {/* Interactive Modals */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        walletBalance={walletBalance}
      />

      <TicketPassModal
        isOpen={passModalOpen}
        onClose={() => setPassModalOpen(false)}
        ticketData={selectedTicket}
      />
    </div>
  );
}
