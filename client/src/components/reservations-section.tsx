import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Reservation, ParkingLot } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface ReservationsSectionProps {
  onNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function ReservationsSection({ onNotification }: ReservationsSectionProps) {
  const [selectedLot, setSelectedLot] = useState<string>('');
  const [dateTime, setDateTime] = useState('');
  const [duration, setDuration] = useState('60');
  const queryClient = useQueryClient();

  // Fetch reservations
  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
  });

  // Fetch parking lots
  const { data: parkingLots = [] } = useQuery<ParkingLot[]>({
    queryKey: ['/api/parking-lots'],
  });

  // New reservation mutation
  const newReservationMutation = useMutation({
    mutationFn: async (data: any) => {
      const startTime = new Date(data.dateTime);
      const endTime = new Date(startTime.getTime() + parseInt(data.duration) * 60000);
      
      // Find available spot in selected lot
      const availableSpots = await fetch(`/api/spots/available?lotId=${data.lotId}`).then(r => r.json());
      if (availableSpots.length === 0) {
        throw new Error('Não há vagas disponíveis neste estacionamento');
      }

      const spot = availableSpots[0];
      const selectedLot = parkingLots.find(lot => lot.id === data.lotId);
      const pricePerHour = parseFloat(selectedLot?.pricePerHour || '6.00');
      const hours = parseInt(data.duration) / 60;
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
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spots'] });
      onNotification('Reserva criada com sucesso!', 'success');
      setSelectedLot('');
      setDateTime('');
    },
    onError: (error: any) => {
      onNotification(error.message || 'Erro ao criar reserva', 'error');
    },
  });

  // Cancel reservation mutation
  const cancelReservationMutation = useMutation({
    mutationFn: (reservationId: string) => 
      apiRequest('PATCH', `/api/reservations/${reservationId}`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spots'] });
      onNotification('Reserva cancelada com sucesso!', 'success');
    },
    onError: () => {
      onNotification('Erro ao cancelar reserva', 'error');
    },
  });

  const handleNewReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot || !dateTime) {
      onNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    newReservationMutation.mutate({
      lotId: selectedLot,
      dateTime,
      duration,
    });
  };

  const activeReservations = reservations.filter(r => r.status === 'pending' || r.status === 'active');
  const historyReservations = reservations.filter(r => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Minhas Reservas</h2>
        <p className="text-muted-foreground">Gerencie suas reservas de vagas de estacionamento</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Reservations */}
          <Card>
            <CardHeader>
              <CardTitle>Reservas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {activeReservations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Você não possui reservas ativas no momento.
                </p>
              ) : (
                <div className="space-y-4">
                  {activeReservations.map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {/* Spot number would come from joined data */}
                            #{reservation.id.slice(-3)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            Reserva #{reservation.id.slice(-6)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(reservation.startTime).toLocaleString('pt-BR')} - {new Date(reservation.endTime).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-600 text-white hover:bg-green-700"
                          data-testid={`button-activate-${reservation.id}`}
                        >
                          Ativar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => cancelReservationMutation.mutate(reservation.id)}
                          disabled={cancelReservationMutation.isPending}
                          data-testid={`button-cancel-${reservation.id}`}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Reservation History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              {historyReservations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum histórico de reservas encontrado.
                </p>
              ) : (
                <div className="space-y-4">
                  {historyReservations.map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          reservation.status === 'completed' 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}>
                          {reservation.status === 'completed' ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <X className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            Reserva #{reservation.id.slice(-6)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(reservation.createdAt!).toLocaleDateString('pt-BR')} - 
                            {reservation.status === 'completed' ? ' Concluída' : ' Cancelada'}
                          </p>
                        </div>
                      </div>
                      <span className={`font-medium ${
                        reservation.status === 'completed' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {reservation.status === 'completed' 
                          ? `R$ ${reservation.totalCost}` 
                          : 'Cancelada'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* New Reservation */}
          <Card>
            <CardHeader>
              <CardTitle>Nova Reserva</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewReservation} className="space-y-4">
                <div>
                  <Label htmlFor="parking-lot">Estacionamento</Label>
                  <Select value={selectedLot} onValueChange={setSelectedLot}>
                    <SelectTrigger data-testid="select-parking-lot">
                      <SelectValue placeholder="Selecione um estacionamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {parkingLots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-time">Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    data-testid="input-date-time"
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Duração</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger data-testid="select-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                      <SelectItem value="480">8 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={newReservationMutation.isPending}
                  data-testid="button-make-reservation"
                >
                  {newReservationMutation.isPending ? 'Criando...' : 'Fazer Reserva'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total gasto este mês:</span>
                  <span className="font-medium text-foreground">
                    R$ {reservations
                      .filter(r => r.status === 'completed')
                      .reduce((sum, r) => sum + parseFloat(r.totalCost || '0'), 0)
                      .toFixed(2)
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reservas canceladas:</span>
                  <span className="font-medium text-red-600">
                    {reservations.filter(r => r.status === 'cancelled').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reservas ativas:</span>
                  <span className="font-medium text-green-600">
                    {activeReservations.length}
                  </span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-medium">
                  <span className="text-foreground">Status:</span>
                  <span className="text-primary">Ativo</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" data-testid="button-add-balance">
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
