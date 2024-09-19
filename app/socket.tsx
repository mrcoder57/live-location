"use client";

import { io } from "socket.io-client";
if(typeof window != "undefined"){
    const socket = io();
}