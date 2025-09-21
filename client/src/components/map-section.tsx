import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ParkingLot } from '@shared/schema';

// Leaflet imports (loaded via CDN)
declare global {
  interface Window {
    L: any;
  }
}

interface MapSectionProps {
  onNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function MapSection({ onNotification }: MapSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedParking, setSelectedParking] = useState<ParkingLot | null>(null);
  const [searchRadius, setSearchRadius] = useState('2');
  const [filterShoppingCenters, setFilterShoppingCenters] = useState(true);
  const [filterPublicParking, setFilterPublicParking] = useState(true);
  const [filterPrivateParking, setFilterPrivateParking] = useState(false);

  // Fetch parking lots
  const { data: parkingLots = [] } = useQuery<ParkingLot[]>({
    queryKey: ['/api/parking-lots'],
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Wait for Leaflet to be loaded
    const initMap = () => {
      if (typeof window !== 'undefined' && window.L) {
        const map = window.L.map(mapRef.current).setView([-23.5505, -46.6333], 13);
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        mapInstanceRef.current = map;
      } else {
        // If Leaflet not loaded yet, try again in 100ms
        setTimeout(initMap, 100);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when parking lots change
  useEffect(() => {
    if (!mapInstanceRef.current || !parkingLots.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    parkingLots.forEach(lot => {
      const marker = window.L.marker([parseFloat(lot.latitude), parseFloat(lot.longitude)]).addTo(mapInstanceRef.current);
      
      const popupContent = `
        <div class="p-2">
          <h4 class="font-semibold text-foreground">${lot.name}</h4>
          <p class="text-sm text-muted-foreground mb-2">${lot.description}</p>
          <div class="flex justify-between text-sm mb-2">
            <span>Total de vagas:</span>
            <span class="font-medium">${lot.totalSpots}</span>
          </div>
          <div class="flex justify-between text-sm mb-2">
            <span>Preço/hora:</span>
            <span class="font-medium">R$ ${lot.pricePerHour}</span>
          </div>
          <button onclick="window.selectParkingFromMap('${lot.id}')" 
                  class="w-full bg-blue-600 text-white py-1 px-2 rounded text-sm hover:bg-blue-700 transition-colors">
            Ver Detalhes
          </button>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });
  }, [parkingLots]);

  // Global function for popup button clicks
  useEffect(() => {
    (window as any).selectParkingFromMap = (lotId: string) => {
      const lot = parkingLots.find(l => l.id === lotId);
      if (lot) {
        setSelectedParking(lot);
      }
    };

    return () => {
      delete (window as any).selectParkingFromMap;
    };
  }, [parkingLots]);

  const handleNavigate = () => {
    if (selectedParking) {
      onNotification(`Navegação iniciada para ${selectedParking.name}`, 'info');
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Mapa Interativo</h2>
        <p className="text-muted-foreground">Localize estacionamentos próximos e navegue até eles</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div 
                ref={mapRef} 
                className="w-full h-96 rounded-lg"
                data-testid="map-container"
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Raio de Busca
                </label>
                <Select value={searchRadius} onValueChange={setSearchRadius}>
                  <SelectTrigger data-testid="select-search-radius">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 km</SelectItem>
                    <SelectItem value="2">2 km</SelectItem>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Estacionamento
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="shopping-centers"
                      checked={filterShoppingCenters}
                      onCheckedChange={setFilterShoppingCenters}
                      data-testid="checkbox-shopping-centers"
                    />
                    <label htmlFor="shopping-centers" className="text-sm text-foreground">
                      Shopping Centers
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="public-parking"
                      checked={filterPublicParking}
                      onCheckedChange={setFilterPublicParking}
                      data-testid="checkbox-public-parking"
                    />
                    <label htmlFor="public-parking" className="text-sm text-foreground">
                      Rua/Público
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="private-parking"
                      checked={filterPrivateParking}
                      onCheckedChange={setFilterPrivateParking}
                      data-testid="checkbox-private-parking"
                    />
                    <label htmlFor="private-parking" className="text-sm text-foreground">
                      Privados
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Parking Info */}
          {selectedParking && (
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-selected-parking-name">
                  {selectedParking.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-selected-parking-description">
                  {selectedParking.description}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de vagas:</span>
                    <span className="font-medium text-foreground" data-testid="text-selected-parking-spots">
                      {selectedParking.totalSpots}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preço/hora:</span>
                    <span className="font-medium text-foreground" data-testid="text-selected-parking-price">
                      R$ {selectedParking.pricePerHour}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Endereço:</span>
                    <span className="font-medium text-foreground text-right" data-testid="text-selected-parking-address">
                      {selectedParking.address}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleNavigate}
                  data-testid="button-navigate"
                >
                  Navegar até aqui
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
