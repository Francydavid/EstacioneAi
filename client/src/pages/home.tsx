import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { DashboardSection } from '@/components/dashboard-section';
import { MapSection } from '@/components/map-section';
import { ReservationsSection } from '@/components/reservations-section';
import { AdminSection } from '@/components/admin-section';
import { ContactSection } from '@/components/contact-section';
import { SpotModal } from '@/components/spot-modal';
import { NotificationContainer } from '@/components/notification-container';
import { useWebSocket } from '@/hooks/use-websocket';
import { WebSocketMessage } from '@/lib/types';
import { ParkingSpot } from '@shared/schema';

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>>([]);
  
  const queryClient = useQueryClient();

  // WebSocket message handler for real-time updates
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'spot_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/spots'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        addNotification('Status da vaga atualizado em tempo real', 'info');
        break;
      case 'reservation_created':
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/spots'] });
        setNotificationCount(prev => prev + 1);
        break;
      case 'reservation_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        break;
      case 'reservation_deleted':
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/spots'] });
        break;
    }
  }, [queryClient]);

  // Initialize WebSocket connection
  useWebSocket(handleWebSocketMessage);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const handleSpotSelect = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
  };

  const closeSpotModal = () => {
    setSelectedSpot(null);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardSection 
            onNotification={addNotification}
            onSpotSelect={handleSpotSelect}
          />
        );
      case 'map':
        return <MapSection onNotification={addNotification} />;
      case 'reservations':
        return <ReservationsSection onNotification={addNotification} />;
      case 'admin':
        return <AdminSection onNotification={addNotification} />;
      case 'contact':
        return <ContactSection onNotification={addNotification} />;
      default:
        return (
          <DashboardSection 
            onNotification={addNotification}
            onSpotSelect={handleSpotSelect}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        notificationCount={notificationCount}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="fade-in">
          {renderActiveSection()}
        </div>
      </main>

      {/* Spot Modal */}
      {selectedSpot && (
        <SpotModal
          spot={selectedSpot}
          onClose={closeSpotModal}
          onNotification={addNotification}
          onReservationComplete={() => {
            setNotificationCount(prev => prev + 1);
            closeSpotModal();
          }}
        />
      )}

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}
