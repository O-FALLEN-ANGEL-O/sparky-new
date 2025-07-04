'use client';

import React from 'react';
import { Product3DViewer } from './product-3d-viewer';

export function Product3DViewerClient(props: { modelUrl: string }) {
  return <Product3DViewer modelUrl={props.modelUrl} />;
}
