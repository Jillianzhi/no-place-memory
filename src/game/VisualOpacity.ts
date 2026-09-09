interface OpacityMaterial {
  opacity: number;
  transparent: boolean;
  userData: Record<string, unknown>;
}

export function applyVisualOpacity(material: OpacityMaterial, groupOpacity: number): void {
  const baseOpacity = typeof material.userData.visualBaseOpacity === 'number'
    ? material.userData.visualBaseOpacity
    : material.opacity;
  material.userData.visualBaseOpacity = baseOpacity;
  material.opacity = baseOpacity * groupOpacity;
  material.transparent = material.opacity < 1 || material.transparent;
}
