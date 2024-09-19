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
import { socket } from '@/app/socket'; // Ensure this is correctly set up
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Import Leaflet for types
import { Button } from "../button";
 
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
    const mapRef = useRef<L.Map | null>(null);
    const customIcon = L.icon({
        iconUrl: "location.png", 
        iconSize: [30, 50], 
        iconAnchor: [12, 41], 
        popupAnchor: [1, -34], 
    });

    useEffect(() => {
        socket.on('locationUpdate', (location: Location) => {
            setLocations((prevLocations) => {
                const updatedLocations = prevLocations.filter((loc) => loc.id !== location.id);
                updatedLocations.push(location);
                return updatedLocations;
            });
        });

        return () => {
            socket.off('locationUpdate');
        };
    }, []);

    const sendLocation = (id: string, lat: number, lng: number) => {
        socket.emit('locationUpdate', { id, lat, lng });
    };

    const getLiveLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const id = 'user1'; // This should be unique for each user
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
        const id = 'user1'; // This should be unique for each user
        const interval = setInterval(() => {
            const lat = Math.random() * 90; // Replace with real location
            const lng = Math.random() * 180; // Replace with real location
            sendLocation(id, lat, lng);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Update the map view when userLocation changes
    useEffect(() => {
        if (userLocation && mapRef.current) {
            mapRef.current.setView([userLocation.lat, userLocation.lng], 13); // Focus on user location
        }
    }, [userLocation]);

    // Get user's live location and set initial view
    useEffect(() => {
        getLiveLocation();
    }, []);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="px-4 py-2 rounded ">
                    Get location
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
