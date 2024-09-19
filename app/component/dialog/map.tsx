"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { io, Socket } from "socket.io-client"; // Import Socket type for TypeScript
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; 
import { Button } from "../../../components/ui/button";

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

interface Location {
    id: string;
    lat: number;
    lng: number;
}

const Map = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null); // Manage socket state
    const mapRef = useRef<L.Map | null>(null);
    
    const customIcon = L.icon({
        iconUrl: 'location.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const socketInstance = io(); // Create socket instance
            setSocket(socketInstance); // Store socket instance in state

            socketInstance.on('locationUpdate', (location: Location) => {
                setLocations((prevLocations) => {
                    const updatedLocations = prevLocations.filter((loc) => loc.id !== location.id);
                    updatedLocations.push(location);
                    return updatedLocations;
                });
            });

            return () => {
                socketInstance.off('locationUpdate'); // Clean up socket events
                socketInstance.disconnect(); // Optionally disconnect the socket
            };
        }
    }, []);

    const sendLocation = (id: string, lat: number, lng: number) => {
        if (socket) {
            socket.emit('locationUpdate', { id, lat, lng });
        }
    };

    const getLiveLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const id = 'user1';
                sendLocation(id, latitude, longitude);
                setUserLocation({ id, lat: latitude, lng: longitude });
            }, (error) => {
                console.error("Error getting location:", error);
            });
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    };

    useEffect(() => {
        getLiveLocation();
    }, []);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    Get Live Location
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Live User Location</DialogTitle>
                    <DialogDescription>
                        The map below shows your live location.
                    </DialogDescription>
                </DialogHeader>
                <div style={{ height: '400px', width: '100%' }}>
                    <MapContainer
                        center={userLocation ? [userLocation.lat, userLocation.lng] : [0, 0]}
                        zoom={userLocation ? 13 : 2}
                        ref={mapRef}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {locations.map((location) => (
                            <Marker key={location.id} position={[location.lat, location.lng]} icon={customIcon} />
                        ))}
                        {userLocation && (
                            <Marker position={[userLocation.lat, userLocation.lng]} icon={customIcon} />
                        )}
                    </MapContainer>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default Map;
