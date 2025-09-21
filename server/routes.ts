import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { sendContactNotification, sendReservationConfirmation } from "./services/email";
import { insertContactMessageSchema, insertReservationSchema, insertParkingSpotSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store WebSocket connections
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // API Routes

  // Parking lots
  app.get("/api/parking-lots", async (req, res) => {
    try {
      const lots = await storage.getAllParkingLots();
      res.json(lots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking lots" });
    }
  });

  app.get("/api/parking-lots/:id", async (req, res) => {
    try {
      const lot = await storage.getParkingLot(req.params.id);
      if (!lot) {
        return res.status(404).json({ message: "Parking lot not found" });
      }
      res.json(lot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking lot" });
    }
  });

  // Parking spots
  app.get("/api/spots", async (req, res) => {
    try {
      const { lotId } = req.query;
      const spots = lotId 
        ? await storage.getSpotsByLot(lotId as string)
        : await storage.getAllSpots();
      res.json(spots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking spots" });
    }
  });

  app.get("/api/spots/available", async (req, res) => {
    try {
      const { lotId } = req.query;
      const spots = await storage.getAvailableSpots(lotId as string);
      res.json(spots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available spots" });
    }
  });

  app.patch("/api/spots/:id", async (req, res) => {
    try {
      const spotData = insertParkingSpotSchema.partial().parse(req.body);
      const updatedSpot = await storage.updateSpot(req.params.id, spotData);
      
      if (!updatedSpot) {
        return res.status(404).json({ message: "Parking spot not found" });
      }

      // Broadcast real-time update
      broadcast({
        type: 'spot_updated',
        data: updatedSpot
      });

      res.json(updatedSpot);
    } catch (error) {
      res.status(400).json({ message: "Invalid spot data" });
    }
  });

  // Reservations
  app.get("/api/reservations", async (req, res) => {
    try {
      const { userId } = req.query;
      const reservations = userId 
        ? await storage.getUserReservations(userId as string)
        : await storage.getAllReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  app.post("/api/reservations", async (req, res) => {
    try {
      const reservationData = insertReservationSchema.parse(req.body);
      
      // Check if spot is available
      const spot = await storage.getSpot(reservationData.spotId);
      if (!spot || spot.status !== 'available') {
        return res.status(400).json({ message: "Parking spot is not available" });
      }

      // Create reservation
      const reservation = await storage.createReservation(reservationData);
      
      // Update spot status to reserved
      await storage.updateSpot(reservationData.spotId, { status: 'reserved' });

      // Broadcast real-time update
      const updatedSpot = await storage.getSpot(reservationData.spotId);
      broadcast({
        type: 'spot_updated',
        data: updatedSpot
      });

      broadcast({
        type: 'reservation_created',
        data: reservation
      });

      // Send confirmation email if email service is available
      if (req.body.email && req.body.spotNumber) {
        await sendReservationConfirmation({
          email: req.body.email,
          spotNumber: req.body.spotNumber,
          startTime: new Date(reservationData.startTime),
          endTime: new Date(reservationData.endTime),
          cost: reservationData.totalCost || "0.00",
        });
      }

      res.status(201).json(reservation);
    } catch (error) {
      res.status(400).json({ message: "Invalid reservation data" });
    }
  });

  app.patch("/api/reservations/:id", async (req, res) => {
    try {
      const reservationData = insertReservationSchema.partial().parse(req.body);
      const reservation = await storage.getReservation(req.params.id);
      
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      const updatedReservation = await storage.updateReservation(req.params.id, reservationData);

      // If reservation is cancelled, free up the spot
      if (reservationData.status === 'cancelled') {
        await storage.updateSpot(reservation.spotId, { status: 'available' });
        
        const updatedSpot = await storage.getSpot(reservation.spotId);
        broadcast({
          type: 'spot_updated',
          data: updatedSpot
        });
      }

      // Broadcast real-time update
      broadcast({
        type: 'reservation_updated',
        data: updatedReservation
      });

      res.json(updatedReservation);
    } catch (error) {
      res.status(400).json({ message: "Invalid reservation data" });
    }
  });

  app.delete("/api/reservations/:id", async (req, res) => {
    try {
      const reservation = await storage.getReservation(req.params.id);
      
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      // Free up the spot if reservation was active
      if (reservation.status !== 'cancelled') {
        await storage.updateSpot(reservation.spotId, { status: 'available' });
        
        const updatedSpot = await storage.getSpot(reservation.spotId);
        broadcast({
          type: 'spot_updated',
          data: updatedSpot
        });
      }

      const deleted = await storage.deleteReservation(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      // Broadcast real-time update
      broadcast({
        type: 'reservation_deleted',
        data: { id: req.params.id }
      });

      res.json({ message: "Reservation deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reservation" });
    }
  });

  // Contact messages
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(contactData);

      // Send notification email if email service is available
      await sendContactNotification({
        name: contactData.name,
        email: contactData.email,
        subject: contactData.subject,
        message: contactData.message,
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid contact data" });
    }
  });

  app.get("/api/contact", async (req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact messages" });
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const allSpots = await storage.getAllSpots();
      const allReservations = await storage.getAllReservations();
      
      const totalSpots = allSpots.length;
      const availableSpots = allSpots.filter(spot => spot.status === 'available').length;
      const occupiedSpots = allSpots.filter(spot => spot.status === 'occupied').length;
      const reservedSpots = allSpots.filter(spot => spot.status === 'reserved').length;
      
      const activeReservations = allReservations.filter(r => r.status === 'active').length;
      const todayReservations = allReservations.filter(r => {
        const today = new Date();
        const reservationDate = new Date(r.createdAt!);
        return reservationDate.toDateString() === today.toDateString();
      }).length;

      res.json({
        totalSpots,
        availableSpots,
        occupiedSpots,
        reservedSpots,
        activeReservations,
        todayReservations,
        occupancyRate: Math.round((occupiedSpots / totalSpots) * 100),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  return httpServer;
}
