import React from "react";
import { HandGestureState } from "@/hooks/useHandTracking";

interface Props {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    gestureState: HandGestureState;
}

const HandTrackingCamera: React.FC<Props> = ({ videoRef, canvasRef, gestureState }) => {

    return (
        <div className="absolute top-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            <div className="relative w-48 h-36 rounded-lg overflow-hidden border-2 border-primary shadow-lg bg-black/50">
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 playsInline"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                />
            </div>
            <div className="mt-2 text-right bg-black/50 p-2 rounded text-white font-mono text-xs shadow-md">
                <p>Gesture: <span className="text-primary font-bold">{gestureState.gesture}</span></p>
                <p>X: {gestureState.moveX.toFixed(2)} | Y: {gestureState.moveZ.toFixed(2)}</p>
            </div>
        </div>
    );
};

export default HandTrackingCamera;
