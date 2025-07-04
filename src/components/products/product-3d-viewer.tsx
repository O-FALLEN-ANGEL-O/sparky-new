'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Preload, Stage } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} dispose={null} />;
}

type Product3DViewerProps = {
  modelUrl: string;
};

const CanvasLoader = () => {
    return (
        <div className="flex items-center justify-center h-full w-full">
            <Skeleton className="h-full w-full rounded-md" />
        </div>
    );
};

export function Product3DViewer({ modelUrl }: Product3DViewerProps) {
  return (
    <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">3D Viewer</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="w-full h-80 bg-muted/50 rounded-md">
                <Canvas
                    shadows
                    dpr={[1, 2]}
                    camera={{ fov: 45, position: [0, 0, 5] }}
                    frameloop="demand"
                >
                    <Suspense fallback={<CanvasLoader />}>
                        <Stage environment="city" intensity={0.6}>
                            <Model url={modelUrl} />
                        </Stage>
                        <OrbitControls autoRotate enableZoom />
                        <Preload all />
                    </Suspense>
                </Canvas>
            </div>
        </CardContent>
    </Card>
  );
}
