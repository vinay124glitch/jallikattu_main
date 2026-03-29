import { useEffect, useRef, useState } from "react";
import { Hands, Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export interface HandGestureState {
    moveX: number; // -1 to 1 for left/right
    moveZ: number; // -1 to 1 for up/down
    isFist: boolean;
    isOpenPalm: boolean;
    swipe: "UP" | "DOWN" | "LEFT" | "RIGHT" | null;
    gesture: string;
}

export const useHandTracking = () => {
    const [gestureState, setGestureState] = useState<HandGestureState>({
        moveX: 0,
        moveZ: 0,
        isFist: false,
        isOpenPalm: false,
        swipe: null,
        gesture: "NEUTRAL",
    });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastPositions = useRef<{ x: number, y: number, time: number }[]>([]);

    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            },
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6,
        });

        hands.onResults((results: Results) => {
            const canvasCtx = canvasRef.current?.getContext("2d");
            if (!canvasCtx || !canvasRef.current) return;

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // Draw video feed
            canvasCtx.translate(canvasRef.current.width, 0);
            canvasCtx.scale(-1, 1);
            canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0];

                // Draw landmarks
                for (const landmark of landmarks) {
                    canvasCtx.beginPath();
                    canvasCtx.arc(landmark.x * canvasRef.current.width, landmark.y * canvasRef.current.height, 3, 0, 2 * Math.PI);
                    canvasCtx.fillStyle = "#FF0000";
                    canvasCtx.fill();
                }

                // Logic from python version
                const tips = [8, 12, 16, 20];
                const pips = [6, 10, 14, 18];

                const thumbTip = landmarks[4];
                const thumbIp = landmarks[3];
                const thumbExtended = Math.sqrt(Math.pow(thumbTip.x - thumbIp.x, 2) + Math.pow(thumbTip.y - thumbIp.y, 2)) > 0.05;

                let fingers = [thumbExtended];
                for (let i = 0; i < 4; i++) {
                    fingers.push(landmarks[tips[i]].y < landmarks[pips[i]].y);
                }

                const isFist = fingers.filter(f => f).length < 2;
                const isOpenPalm = fingers.filter(f => f).length >= 4;

                const palm = landmarks[9];
                const currentTime = Date.now() / 1000;

                lastPositions.current.push({ x: palm.x, y: palm.y, time: currentTime });
                if (lastPositions.current.length > 5) lastPositions.current.shift();

                let moveX = 0;
                let moveZ = 0;
                let gesture = "NEUTRAL";
                let isCharging = false;
                let swipe: "UP" | "DOWN" | "LEFT" | "RIGHT" | null = null;

                // Detect swipe
                if (lastPositions.current.length >= 3) {
                    const recent = lastPositions.current.slice(-3);
                    const first = recent[0];
                    const last = recent[2];
                    const dx = last.x - first.x;
                    const dy = last.y - first.y;
                    const dt = last.time - first.time;

                    if (dt > 0) {
                        const vx = dx / dt;
                        const vy = dy / dt;
                        const threshold = 2.0;

                        if (Math.abs(vx) > threshold || Math.abs(vy) > threshold) {
                            if (Math.abs(vx) > Math.abs(vy)) {
                                swipe = vx < 0 ? "RIGHT" : "LEFT"; // Mirrored
                            } else {
                                swipe = vy < 0 ? "UP" : "DOWN";
                            }
                        }
                    }
                }

                // DIRECT MAPPING: Hand position controls human direction
                gesture = "HAND TRACKING ACTIVE";
                const deadzone = 0.05;
                const xOffset = palm.x - 0.5;
                const yOffset = palm.y - 0.5;

                if (Math.abs(xOffset) > deadzone) {
                    moveX = xOffset * 3.0; // Increased sensitivity
                }
                if (Math.abs(yOffset) > deadzone) {
                    moveZ = yOffset * 3.0;
                }

                // Still detect fist for "Sprint" or special actions if needed
                if (isFist) {
                    gesture = "FIST (SPRINT)";
                    // We can use isFist in useGameLogic to increase speed
                }

                setGestureState({
                    moveX: Math.max(-1, Math.min(1, moveX)),
                    moveZ: Math.max(-1, Math.min(1, moveZ)),
                    isFist,
                    isOpenPalm,
                    swipe,
                    gesture
                });

            } else {
                setGestureState({ moveX: 0, moveZ: 0, isFist: false, isOpenPalm: false, swipe: null, gesture: "NEUTRAL" });
            }
            canvasCtx.restore();
        });

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current) {
                    await hands.send({ image: videoRef.current });
                }
            },
            width: 320,
            height: 240,
        });

        camera.start();

        return () => {
            camera.stop();
            hands.close();
        };
    }, []);

    return { videoRef, canvasRef, gestureState };
};
