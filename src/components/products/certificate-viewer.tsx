'use client';
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type CertificateViewerProps = {
    certificateUrl: string;
}

export function CertificateViewer({ certificateUrl }: CertificateViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Certification</CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => s + 0.2)} disabled={scale > 2}><ZoomIn className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => s - 0.2)} disabled={scale < 0.5}><ZoomOut className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRotation(r => (r + 90) % 360)}><RotateCw className="h-4 w-4" /></Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full h-80 overflow-auto bg-muted/50 rounded-md flex items-center justify-center p-2">
                    <Document
                        file={certificateUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<Skeleton className="w-full h-full" />}
                        error={<p className="text-destructive text-center p-4">Failed to load PDF certificate.</p>}
                    >
                        <Page pageNumber={pageNumber} scale={scale} rotate={rotation} />
                    </Document>
                </div>
                {numPages && numPages > 1 && (
                    <div className="text-center text-sm text-muted-foreground mt-2 flex justify-center items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>Prev</Button>
                        <span>Page {pageNumber} of {numPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>Next</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
