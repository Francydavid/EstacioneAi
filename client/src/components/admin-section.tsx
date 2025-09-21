import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ParkingSpot, Reservation } from '@shared/schema';
import { DashboardStats } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

interface AdminSectionProps {
  onNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function AdminSection({ onNotification }: AdminSectionProps) {
  const queryClient = useQueryClient();

  // Fetch admin data
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: spots = [] } = useQuery<ParkingSpot[]>({
    queryKey: ['/api/spots'],
  });

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
  });

  // Update spot status mutation
  const updateSpotMutation = useMutation({
    mutationFn: ({ spotId, status }: { spotId: string; status: string }) =>
      apiRequest('PATCH', `/api/spots/${spotId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      onNotification('Status da vaga atualizado com sucesso!', 'success');
    },
    onError: () => {
      onNotification('Erro ao atualizar status da vaga', 'error');
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

  const getActionButton = (spot: ParkingSpot) => {
    switch (spot.status) {
      case 'available':
        return (
          <Button
            size="sm"
            variant="outline"
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => updateSpotMutation.mutate({ spotId: spot.id, status: 'reserved' })}
            disabled={updateSpotMutation.isPending}
            data-testid={`button-reserve-${spot.id}`}
          >
            Reservar
          </Button>
        );
      case 'occupied':
        return (
          <Button
            size="sm"
            variant="outline"
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => updateSpotMutation.mutate({ spotId: spot.id, status: 'available' })}
            disabled={updateSpotMutation.isPending}
            data-testid={`button-free-${spot.id}`}
          >
            Liberar
          </Button>
        );
      case 'reserved':
        return (
          <Button
            size="sm"
            variant="outline"
            className="bg-gray-600 text-white hover:bg-gray-700"
            onClick={() => updateSpotMutation.mutate({ spotId: spot.id, status: 'available' })}
            disabled={updateSpotMutation.isPending}
            data-testid={`button-cancel-${spot.id}`}
          >
            Cancelar
          </Button>
        );
      default:
        return null;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'free-all':
        onNotification('Função de liberar todas as vagas não implementada', 'info');
        break;
      case 'maintenance':
        onNotification('Modo de manutenção não implementado', 'info');
        break;
      case 'report':
        onNotification('Relatório completo não implementado', 'info');
        break;
      case 'backup':
        onNotification('Backup do sistema não implementado', 'info');
        break;
    }
  };

  // Calculate derived stats
  const dailyRevenue = reservations
    .filter(r => {
      const today = new Date();
      const reservationDate = new Date(r.createdAt!);
      return reservationDate.toDateString() === today.toDateString() && r.status === 'completed';
    })
    .reduce((sum, r) => sum + parseFloat(r.totalCost || '0'), 0);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Administrativo</h2>
        <p className="text-muted-foreground">Gerencie vagas e visualize estatísticas do sistema</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-occupancy-rate">
                      {stats?.occupancyRate || 0}%
                    </p>
                    <p className="text-xs text-green-600 font-medium">Sistema ativo</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Receita Diária</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-daily-revenue">
                      R$ {dailyRevenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600 font-medium">Hoje</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reservas Ativas</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-active-reservations">
                      {stats?.activeReservations || 0}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">Em andamento</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Parking Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gerenciamento de Vagas</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" data-testid="button-refresh-status">
                    Atualizar Status
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-export-data">
                    Exportar Dados
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vaga</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spots.slice(0, 10).map((spot) => (
                      <TableRow key={spot.id}>
                        <TableCell className="font-medium">{spot.spotNumber}</TableCell>
                        <TableCell>{getStatusBadge(spot.status)}</TableCell>
                        <TableCell>{spot.sector}</TableCell>
                        <TableCell>{spot.isActive ? 'Sim' : 'Não'}</TableCell>
                        <TableCell>{getActionButton(spot)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {spots.length > 10 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    Ver Todas as Vagas ({spots.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-green-600 text-white hover:bg-green-700"
                onClick={() => handleQuickAction('free-all')}
                data-testid="button-free-all-spots"
              >
                Liberar Todas as Vagas
              </Button>
              <Button 
                className="w-full bg-orange-600 text-white hover:bg-orange-700"
                onClick={() => handleQuickAction('maintenance')}
                data-testid="button-maintenance-mode"
              >
                Modo Manutenção
              </Button>
              <Button 
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => handleQuickAction('report')}
                data-testid="button-full-report"
              >
                Relatório Completo
              </Button>
              <Button 
                className="w-full bg-purple-600 text-white hover:bg-purple-700"
                onClick={() => handleQuickAction('backup')}
                data-testid="button-backup-system"
              >
                Backup Sistema
              </Button>
            </CardContent>
          </Card>
          
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sensores Ativos</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-foreground">
                    {spots.filter(s => s.isActive).length}/{spots.length}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conexão de Rede</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-foreground">Estável</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Último Update</span>
                <span className="text-sm font-medium text-foreground">Agora</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime Sistema</span>
                <span className="text-sm font-medium text-foreground">99.9%</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sistema iniciado</p>
                  <p className="text-xs text-muted-foreground">Agora</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">WebSocket conectado</p>
                  <p className="text-xs text-muted-foreground">Agora</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">Dashboard carregado</p>
                  <p className="text-xs text-muted-foreground">Agora</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
