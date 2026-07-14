import "fake-indexeddb/auto";
import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

// Node.js 22+ has a built-in global `localStorage` that lacks Web Storage API methods.
// Override it with a fully functional in-memory implementation for all tests.
const createLocalStorageMock = (): Storage => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };
};

Object.defineProperty(globalThis, "localStorage", {
  value: createLocalStorageMock(),
  writable: true,
  configurable: true,
});

// jsdom doesn't implement DOMMatrix (required by pdfjs-dist)
globalThis.DOMMatrix = class DOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  m11 = 1;
  m12 = 0;
  m13 = 0;
  m14 = 0;
  m21 = 0;
  m22 = 1;
  m23 = 0;
  m24 = 0;
  m31 = 0;
  m32 = 0;
  m33 = 1;
  m34 = 0;
  m41 = 0;
  m42 = 0;
  m43 = 0;
  m44 = 1;
  is2D = true;
  isIdentity = true;
  inverse() {
    return new DOMMatrix();
  }
  multiply() {
    return new DOMMatrix();
  }
  translate() {
    return new DOMMatrix();
  }
  scale() {
    return new DOMMatrix();
  }
  rotate() {
    return new DOMMatrix();
  }
  skewX() {
    return new DOMMatrix();
  }
  skewY() {
    return new DOMMatrix();
  }
  flipX() {
    return new DOMMatrix();
  }
  flipY() {
    return new DOMMatrix();
  }
  transformPoint() {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  toFloat32Array() {
    return new Float32Array(16);
  }
  toFloat64Array() {
    return new Float64Array(16);
  }
} as unknown as typeof globalThis.DOMMatrix;

// jsdom doesn't implement ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof globalThis.ResizeObserver;

// jsdom doesn't implement window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

// jsdom doesn't support URL.createObjectURL/revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  applyDialectPluralRules,
  localeResources,
} from "@/services/localeRegistry";

void i18n.use(initReactI18next).init({
  resources: localeResources,
  lng: "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

applyDialectPluralRules(i18n);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
