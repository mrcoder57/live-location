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
        iconUrl: 'location.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            // Only execute this code in the browser
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
        }
    }, []);

    const sendLocation = (id: string, lat: number, lng: number) => {
        socket.emit('locationUpdate', { id, lat, lng });
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
