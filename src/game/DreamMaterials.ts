import * as THREE from 'three';

export class DreamMaterials {
  readonly jade = new THREE.MeshPhysicalMaterial({
    color: 0x91d9ca,
    roughness: 0.34,
    metalness: 0.02,
    transmission: 0.18,
    thickness: 0.55,
    clearcoat: 0.6
  });

  readonly porcelain = new THREE.MeshPhysicalMaterial({
    color: 0xf6f1ff,
    roughness: 0.22,
    metalness: 0.03,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12
  });

  readonly lacquerBlack = new THREE.MeshStandardMaterial({
    color: 0x09090f,
    roughness: 0.18,
    metalness: 0.28
  });

  readonly silverBranch = new THREE.MeshStandardMaterial({
    color: 0xd9e5ff,
    roughness: 0.2,
    metalness: 0.82,
    emissive: 0x2e4d74,
    emissiveIntensity: 0.18
  });

  readonly petal = new THREE.MeshStandardMaterial({
    color: 0xffb7d1,
    roughness: 0.55,
    side: THREE.DoubleSide,
    emissive: 0x5e2442,
    emissiveIntensity: 0.18
  });

  readonly dreamBlue = new THREE.MeshStandardMaterial({
    color: 0x7b8cff,
    roughness: 0.45,
    transparent: true,
    opacity: 0.74,
    emissive: 0x3346c9,
    emissiveIntensity: 0.35
  });

  readonly fogGlass = new THREE.MeshPhysicalMaterial({
    color: 0xdce9ff,
    transparent: true,
    opacity: 0.48,
    roughness: 0.08,
    transmission: 0.38,
    thickness: 0.25
  });

  readonly water = new THREE.MeshPhysicalMaterial({
    color: 0x193e62,
    roughness: 0.05,
    metalness: 0.15,
    transmission: 0.1,
    transparent: true,
    opacity: 0.76,
    clearcoat: 1
  });

  readonly hotspot = new THREE.MeshBasicMaterial({
    color: 0xf8ddff,
    transparent: true,
    opacity: 0.025,
    depthWrite: false
  });

  createWall(color = 0xb9bdd9): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.82,
      metalness: 0.02,
      emissive: 0x151833,
      emissiveIntensity: 0.08
    });
  }

  createGlow(color = 0x9ca7ff, opacity = 0.42): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }
}
