export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface HandGestureData {
  state: TreeState;
  handPosition: {
    x: number; // -1 to 1
    y: number; // -1 to 1
  };
  confidence: number;
  error?: boolean;
}

export interface PositionData {
  chaos: [number, number, number];
  target: [number, number, number];
}

// Global JSX augmentation for React Three Fiber elements to resolve IntrinsicElements errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      mesh: any;
      group: any;
      bufferGeometry: any;
      cylinderGeometry: any;
      octahedronGeometry: any;
      boxGeometry: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      shaderMaterial: any;
      points: any;
      instancedMesh: any;
      bufferAttribute: any;
    }
  }
}