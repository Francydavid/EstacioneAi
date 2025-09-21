import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Square, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ParkingSpot } from './parking-spot';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats, QuickReserveData } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { ParkingSpot as ParkingSpotType } from '@shared/schema';

interface DashboardSectionProps {
  onNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onSpotSelect: (spot: ParkingSpotType) => void;
}

export function DashboardSection({ onNotification, onSpotSelect }: DashboardSectionProps) {
  const [selectedSpot, setSelectedSpot] = useState<string>('');
  const [duration, setDuration] = useState<string>('60');
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch parking spots
  const { data: spots = [] } = useQuery<ParkingSpotType[]>({
    queryKey: ['/api/spots'],
  });

  // Fetch available spots for quick reserve
  const { data: availableSpots = [] } = useQuery<ParkingSpotType[]>({
    queryKey: ['/api/spots/available'],
  });

  // Quick reserve mutation
  const quickReserveMutation = useMutation({
    mutationFn: async (data: QuickReserveData) => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + data.duration * 60000);
      
      // Calculate cost (simplified)
      const pricePerHour = 6.00; // Default price
      const hours = data.duration / 60;
      const totalCost = (hours * pricePerHour).toFixed(2);

      return apiRequest('POST', '/api/reservations', {
        spotId: data.spotId,
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
      onNotification('Vaga reservada com sucesso!', 'success');
      setSelectedSpot('');
    },
    onError: () => {
      onNotification('Erro ao reservar vaga. Tente novamente.', 'error');
    },
  });

  const handleQuickReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) {
      onNotification('Por favor, selecione uma vaga disponível.', 'warning');
      return;
    }

    quickReserveMutation.mutate({
      spotId: selectedSpot,
      duration: parseInt(duration),
    });
  };

  // Group spots by sector for display
  const spotsBySector = spots.reduce((acc, spot) => {
    const sector = spot.sector;
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(spot);
    return acc;
  }, {} as Record<string, ParkingSpotType[]>);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do sistema de estacionamento em tempo real</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vagas Totais</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-spots">
                  {stats?.totalSpots || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Square className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vagas Livres</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-available-spots">
                  {stats?.availableSpots || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reservadas</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="text-reserved-spots">
                  {stats?.reservedSpots || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ocupadas</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-occupied-spots">
                  {stats?.occupiedSpots || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Live Parking Layout and Quick Reserve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Layout do Estacionamento - Shopping Luz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(spotsBySector).map(([sector, sectorSpots]) => (
                  <div key={sector}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{sector}</h4>
                    <div className="grid grid-cols-8 gap-2">
                      {sectorSpots.map((spot) => (
                        <ParkingSpot
                          key={spot.id}
                          spotNumber={spot.spotNumber}
                          status={spot.status as any}
                          onClick={() => onSpotSelect(spot)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center space-x-6 text-sm mt-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-muted-foreground">Livre</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-muted-foreground">Reservada</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-muted-foreground">Ocupada</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Quick Reserve */}
          <Card>
            <CardHeader>
              <CardTitle>Reserva Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickReserve} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Selecionar Vaga
                  </label>
                  <Select value={selectedSpot} onValueChange={setSelectedSpot}>
                    <SelectTrigger data-testid="select-spot">
                      <SelectValue placeholder="Escolha uma vaga disponível" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSpots.map((spot) => (
                        <SelectItem key={spot.id} value={spot.id}>
                          {spot.spotNumber} - {spot.sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tempo de Reserva
                  </label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger data-testid="select-duration">
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
                  type="submit" 
                  className="w-full"
                  disabled={quickReserveMutation.isPending}
                  data-testid="button-quick-reserve"
                >
                  {quickReserveMutation.isPending ? 'Reservando...' : 'Reservar Agora'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Sistema iniciado</span>
                  <span className="text-xs text-muted-foreground ml-auto">Agora</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-muted-foreground">Dashboard carregado</span>
                  <span className="text-xs text-muted-foreground ml-auto">Agora</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
