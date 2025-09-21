import { type User, type InsertUser, type ParkingLot, type InsertParkingLot, type ParkingSpot, type InsertParkingSpot, type Reservation, type InsertReservation, type ContactMessage, type InsertContactMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Parking lot methods
  getAllParkingLots(): Promise<ParkingLot[]>;
  getParkingLot(id: string): Promise<ParkingLot | undefined>;
  createParkingLot(lot: InsertParkingLot): Promise<ParkingLot>;
  updateParkingLot(id: string, lot: Partial<InsertParkingLot>): Promise<ParkingLot | undefined>;

  // Parking spot methods
  getAllSpots(): Promise<ParkingSpot[]>;
  getSpotsByLot(lotId: string): Promise<ParkingSpot[]>;
  getSpot(id: string): Promise<ParkingSpot | undefined>;
  createSpot(spot: InsertParkingSpot): Promise<ParkingSpot>;
  updateSpot(id: string, spot: Partial<InsertParkingSpot>): Promise<ParkingSpot | undefined>;
  getAvailableSpots(lotId?: string): Promise<ParkingSpot[]>;

  // Reservation methods
  getAllReservations(): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | undefined>;
  getUserReservations(userId: string): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: string, reservation: Partial<InsertReservation>): Promise<Reservation | undefined>;
  deleteReservation(id: string): Promise<boolean>;

  // Contact message methods
  getAllContactMessages(): Promise<ContactMessage[]>;
  getContactMessage(id: string): Promise<ContactMessage | undefined>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessage(id: string, message: Partial<InsertContactMessage>): Promise<ContactMessage | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private parkingLots: Map<string, ParkingLot>;
  private parkingSpots: Map<string, ParkingSpot>;
  private reservations: Map<string, Reservation>;
  private contactMessages: Map<string, ContactMessage>;

  constructor() {
    this.users = new Map();
    this.parkingLots = new Map();
    this.parkingSpots = new Map();
    this.reservations = new Map();
    this.contactMessages = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample parking lot
    const shoppingLuzId = randomUUID();
    const shoppingLuz: ParkingLot = {
      id: shoppingLuzId,
      name: "Shopping Luz",
      description: "Estacionamento coberto e seguro no Shopping Luz",
      address: "Rua Ribeiro de Lima, 99 - Luz, São Paulo - SP",
      latitude: "-23.5450",
      longitude: "-46.6380",
      totalSpots: 240,
      pricePerHour: "6.00",
      isActive: true,
      createdAt: new Date(),
    };
    this.parkingLots.set(shoppingLuzId, shoppingLuz);

    // Create sample parking spots
    const sectors = ['A', 'B', 'C', 'D'];
    const spotsPerSector = 8;
    const statuses = ['available', 'occupied', 'reserved'];

    sectors.forEach(sector => {
      for (let i = 1; i <= spotsPerSector; i++) {
        const spotId = randomUUID();
        const spot: ParkingSpot = {
          id: spotId,
          spotNumber: `${sector}${i}`,
          sector: `Setor ${sector}`,
          parkingLotId: shoppingLuzId,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          isActive: true,
          createdAt: new Date(),
        };
        this.parkingSpots.set(spotId, spot);
      }
    });

    // Create additional parking lots
    const shoppingNorteId = randomUUID();
    const shoppingNorte: ParkingLot = {
      id: shoppingNorteId,
      name: "Shopping Center Norte",
      description: "Grande estacionamento com vagas numeradas",
      address: "Travessa Casalbuono, 120 - Vila Guilherme, São Paulo - SP",
      latitude: "-23.5200",
      longitude: "-46.6200",
      totalSpots: 200,
      pricePerHour: "5.50",
      isActive: true,
      createdAt: new Date(),
    };
    this.parkingLots.set(shoppingNorteId, shoppingNorte);

    const centralId = randomUUID();
    const central: ParkingLot = {
      id: centralId,
      name: "Estacionamento Central",
      description: "Próximo à Av. Paulista, localização privilegiada",
      address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
      latitude: "-23.5505",
      longitude: "-46.6333",
      totalSpots: 80,
      pricePerHour: "8.00",
      isActive: true,
      createdAt: new Date(),
    };
    this.parkingLots.set(centralId, central);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Parking lot methods
  async getAllParkingLots(): Promise<ParkingLot[]> {
    return Array.from(this.parkingLots.values()).filter(lot => lot.isActive);
  }

  async getParkingLot(id: string): Promise<ParkingLot | undefined> {
    return this.parkingLots.get(id);
  }

  async createParkingLot(insertLot: InsertParkingLot): Promise<ParkingLot> {
    const id = randomUUID();
    const lot: ParkingLot = { ...insertLot, id, createdAt: new Date() };
    this.parkingLots.set(id, lot);
    return lot;
  }

  async updateParkingLot(id: string, updateData: Partial<InsertParkingLot>): Promise<ParkingLot | undefined> {
    const lot = this.parkingLots.get(id);
    if (!lot) return undefined;
    
    const updatedLot = { ...lot, ...updateData };
    this.parkingLots.set(id, updatedLot);
    return updatedLot;
  }

  // Parking spot methods
  async getAllSpots(): Promise<ParkingSpot[]> {
    return Array.from(this.parkingSpots.values()).filter(spot => spot.isActive);
  }

  async getSpotsByLot(lotId: string): Promise<ParkingSpot[]> {
    return Array.from(this.parkingSpots.values()).filter(spot => 
      spot.parkingLotId === lotId && spot.isActive
    );
  }

  async getSpot(id: string): Promise<ParkingSpot | undefined> {
    return this.parkingSpots.get(id);
  }

  async createSpot(insertSpot: InsertParkingSpot): Promise<ParkingSpot> {
    const id = randomUUID();
    const spot: ParkingSpot = { ...insertSpot, id, createdAt: new Date() };
    this.parkingSpots.set(id, spot);
    return spot;
  }

  async updateSpot(id: string, updateData: Partial<InsertParkingSpot>): Promise<ParkingSpot | undefined> {
    const spot = this.parkingSpots.get(id);
    if (!spot) return undefined;
    
    const updatedSpot = { ...spot, ...updateData };
    this.parkingSpots.set(id, updatedSpot);
    return updatedSpot;
  }

  async getAvailableSpots(lotId?: string): Promise<ParkingSpot[]> {
    return Array.from(this.parkingSpots.values()).filter(spot => 
      spot.status === 'available' && 
      spot.isActive && 
      (!lotId || spot.parkingLotId === lotId)
    );
  }

  // Reservation methods
  async getAllReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(r => r.userId === userId);
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const id = randomUUID();
    const reservation: Reservation = { ...insertReservation, id, createdAt: new Date() };
    this.reservations.set(id, reservation);
    return reservation;
  }

  async updateReservation(id: string, updateData: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const reservation = this.reservations.get(id);
    if (!reservation) return undefined;
    
    const updatedReservation = { ...reservation, ...updateData };
    this.reservations.set(id, updatedReservation);
    return updatedReservation;
  }

  async deleteReservation(id: string): Promise<boolean> {
    return this.reservations.delete(id);
  }

  // Contact message methods
  async getAllContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values());
  }

  async getContactMessage(id: string): Promise<ContactMessage | undefined> {
    return this.contactMessages.get(id);
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const message: ContactMessage = { ...insertMessage, id, createdAt: new Date() };
    this.contactMessages.set(id, message);
    return message;
  }

  async updateContactMessage(id: string, updateData: Partial<InsertContactMessage>): Promise<ContactMessage | undefined> {
    const message = this.contactMessages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, ...updateData };
    this.contactMessages.set(id, updatedMessage);
    return updatedMessage;
  }
}

export const storage = new MemStorage();
