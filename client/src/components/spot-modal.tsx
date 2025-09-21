import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ParkingSpot } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface SpotModalProps {
  spot: ParkingSpot;
  onClose: () => void;
  onNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onReservationComplete: () => void;
}

export function SpotModal({ spot, onClose, onNotification, onReservationComplete }: SpotModalProps) {
  const [duration, setDuration] = useState('60');
  const queryClient = useQueryClient();

  const reserveSpotMutation = useMutation({
    mutationFn: async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000);
      
      // Calculate cost (simplified)
      const pricePerHour = 6.00; // Default price
      const hours = parseInt(duration) / 60;
      const totalCost = (hours * pricePerHour).toFixed(2);

      return apiRequest('POST', '/api/reservations', {
        spotId: spot.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'pending',
        totalCost,
        userId: null, // Para sistema anônimo
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spots/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      onNotification(`Vaga ${spot.spotNumber} reservada com sucesso!`, 'success');
      onReservationComplete();
    },
    onError: () => {
      onNotification('Erro ao reservar vaga. Tente novamente.', 'error');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Livre</Badge>;
      case 'occupied':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ocupada</Badge>;
      case 'reserved':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Reservada</Badge>;
      case 'maintenance':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Manutenção</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const canReserve = spot.status === 'available';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle data-testid="modal-spot-title">Vaga {spot.spotNumber}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span data-testid="modal-spot-status">{getStatusBadge(spot.status)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Localização:</span>
            <span className="text-sm font-medium text-foreground" data-testid="modal-spot-location">
              {spot.sector}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Preço/hora:</span>
            <span className="text-sm font-medium text-foreground">R$ 6,00</span>
          </div>

          {canReserve && (
            <div className="pt-4 border-t border-border space-y-4">
              <div>
                <Label htmlFor="modal-duration">Duração da Reserva</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger data-testid="select-modal-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="240">4 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                className="w-full"
                onClick={() => reserveSpotMutation.mutate()}
                disabled={reserveSpotMutation.isPending}
                data-testid="button-reserve-spot"
              >
                {reserveSpotMutation.isPending ? 'Reservando...' : 'Reservar Esta Vaga'}
              </Button>
            </div>
          )}

          {!canReserve && (
            <div className="pt-4 border-t border-border">
              <Button
                className="w-full"
                disabled
                data-testid="button-spot-unavailable"
              >
                {spot.status === 'occupied' ? 'Vaga Ocupada' : 
                 spot.status === 'reserved' ? 'Vaga Reservada' : 
                 'Vaga Indisponível'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
