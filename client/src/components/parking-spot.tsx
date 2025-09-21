interface ParkingSpotProps {
  spotNumber: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  onClick: () => void;
}

export function ParkingSpot({ spotNumber, status, onClick }: ParkingSpotProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'available':
        return 'bg-green-500 border-green-600 text-white';
      case 'occupied':
        return 'bg-red-500 border-red-600 text-white';
      case 'reserved':
        return 'bg-orange-500 border-orange-600 text-white';
      case 'maintenance':
        return 'bg-gray-500 border-gray-600 text-white';
      default:
        return 'bg-gray-300 border-gray-400 text-gray-700';
    }
  };

  return (
    <div
      className={`parking-spot w-12 h-8 rounded border-2 flex items-center justify-center text-xs font-bold cursor-pointer ${getStatusStyles()}`}
      onClick={onClick}
      data-testid={`parking-spot-${spotNumber}`}
      data-status={status}
    >
      {spotNumber}
    </div>
  );
}
