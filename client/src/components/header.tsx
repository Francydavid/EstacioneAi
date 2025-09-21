import { MapPin, Bell, User } from 'lucide-react';

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  notificationCount: number;
}

export function Header({ activeSection, onSectionChange, notificationCount }: HeaderProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'map', label: 'Mapa' },
    { id: 'reservations', label: 'Reservas' },
    { id: 'admin', label: 'Admin' },
    { id: 'contact', label: 'Contato' },
  ];

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">EstacioneAI</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`font-medium transition-colors ${
                  activeSection === item.id
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                }`}
                data-testid={`nav-button-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary" />
              {notificationCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center text-destructive-foreground"
                  data-testid="notification-count"
                >
                  {notificationCount}
                </span>
              )}
            </div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
