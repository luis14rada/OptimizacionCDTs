import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom no implementa URL.createObjectURL/revokeObjectURL ni una navegación real
// al hacer clic en un <a download>. Los stubbeamos para que el código de exportación
// (CSV) se pueda probar sin errores, sin necesidad de mockear cada test por separado.
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  window.URL.revokeObjectURL = vi.fn();
}

if (typeof HTMLAnchorElement !== 'undefined') {
  HTMLAnchorElement.prototype.click = vi.fn();
}
