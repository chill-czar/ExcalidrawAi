// =============================================================================
// EXCALIDRAW ↔ DSL BIDIRECTIONAL CONVERSION SYSTEM - FIXED ID PRESERVATION & TEXT HANDLING
// =============================================================================

// TYPE DEFINITIONS
// ================

// DSL Element Types
type DSLElementType = 'rect' | 'ellipse' | 'diamond' | 'arrow' | 'line' | 'freedraw' | 'text';
type ExcalidrawElementType = 'rectangle' | 'ellipse' | 'diamond' | 'arrow' | 'line' | 'freedraw' | 'text';

// Color shorthand mapping
type ColorShorthand = 'k' | 'w' | 'r' | 'g' | 'b' | 'y' | 'p' | 'o' | 't';

// Point coordinates
type Point = [number, number];

// DSL Element interfaces
interface BaseDSLElement {
  id: string;
  type: DSLElementType;
  x: number;
  y: number;
  stroke?: ColorShorthand | string;
  fill?: ColorShorthand | string;
  strokeW?: number;
  angle?: number;
  text?: string;
  fontSize?: number;
}

interface DSLRectElement extends BaseDSLElement {
  type: 'rect';
  w: number;
  h: number;
}

interface DSLEllipseElement extends BaseDSLElement {
  type: 'ellipse';
  w: number;
  h: number;
}

interface DSLDiamondElement extends BaseDSLElement {
  type: 'diamond';
  w: number;
  h: number;
}

interface DSLArrowElement extends BaseDSLElement {
  type: 'arrow';
  endX: number;
  endY: number;
  startBind?: string;
  endBind?: string;
}

interface DSLLineElement extends BaseDSLElement {
  type: 'line';
  points: Point[];
}

interface DSLFreedrawElement extends BaseDSLElement {
  type: 'freedraw';
  points: Point[];
}

interface DSLTextElement extends BaseDSLElement {
  type: 'text';
  text: string;
  container?: string;
}

type DSLElement = 
  | DSLRectElement 
  | DSLEllipseElement 
  | DSLDiamondElement 
  | DSLArrowElement 
  | DSLLineElement 
  | DSLFreedrawElement 
  | DSLTextElement;

// Excalidraw Element interfaces
interface ExcalidrawBinding {
  elementId: string;
  focus: number;
  gap: number;
}

interface BoundElement {
  id: string;
  type: 'arrow' | 'text';
}

interface Roundness {
  type: number;
}

interface BaseExcalidrawElement {
  id: string;
  type: ExcalidrawElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  groupIds: string[];
  frameId: string | null;
  index: string;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: BoundElement[];
  updated: number;
  link: string | null;
  locked: boolean;
}

interface ExcalidrawShapeElement extends BaseExcalidrawElement {
  type: 'rectangle' | 'ellipse' | 'diamond';
  roundness: Roundness;
}

interface ExcalidrawArrowElement extends BaseExcalidrawElement {
  type: 'arrow';
  points: Point[];
  roundness: Roundness;
  startArrowhead: string | null;
  endArrowhead: string;
  startBinding: ExcalidrawBinding | null;
  endBinding: ExcalidrawBinding | null;
  lastCommittedPoint: Point | null;
  elbowed: boolean;
}

interface ExcalidrawLineElement extends BaseExcalidrawElement {
  type: 'line';
  points: Point[];
  roundness: Roundness;
  startBinding: ExcalidrawBinding | null;
  endBinding: ExcalidrawBinding | null;
  startArrowhead: string | null;
  endArrowhead: string | null;
  lastCommittedPoint: Point | null;
}

interface ExcalidrawFreedrawElement extends BaseExcalidrawElement {
  type: 'freedraw';
  points: Point[];
  roundness: null;
  pressures: number[];
  simulatePressure: boolean;
  lastCommittedPoint: Point;
}

interface ExcalidrawTextElement extends BaseExcalidrawElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: number;
  textAlign: string;
  verticalAlign: string;
  containerId: string | null;
  originalText: string;
  autoResize: boolean;
  lineHeight: number;
}

type ExcalidrawElement = 
  | ExcalidrawShapeElement 
  | ExcalidrawArrowElement 
  | ExcalidrawLineElement 
  | ExcalidrawFreedrawElement 
  | ExcalidrawTextElement;

// Schema and defaults interfaces
interface DSLSchema {
  TYPES: Record<DSLElementType, ExcalidrawElementType>;
  DEFAULTS: {
    strokeColor: string;
    backgroundColor: string;
    strokeWidth: number;
    strokeStyle: string;
    fillStyle: string;
    opacity: number;
    roughness: number;
    fontSize: number;
    fontFamily: number;
    textAlign: string;
    verticalAlign: string;
    angle: number;
  };
  COLORS: Record<ColorShorthand, string>;
}

// Test result interface
interface TestResult {
  original: DSLElement[];
  excalidraw: ExcalidrawElement[];
  converted: DSLElement[];
}

// Enhanced DSL examples interface
interface EnhancedDSLExamples {
  flowchartWithInlineText: DSLElement[];
  mixedTextExample: DSLElement[];
}

// Element tracking interfaces
interface ElementWithText {
  dslEl: DSLElement;
  element: ExcalidrawElement;
  dslId: string;
  excalidrawId: string;
}

// ENHANCED DSL SCHEMA WITH RELATIONSHIPS & BINDINGS
// =================================================
const DSL_SCHEMA: DSLSchema = {
  // Compact element types (preserving readability)
  TYPES: {
    rect: "rectangle",
    ellipse: "ellipse",
    diamond: "diamond",
    arrow: "arrow",
    line: "line",
    freedraw: "freedraw",
    text: "text",
  },

  // Default values (omitted in DSL to save tokens)
  DEFAULTS: {
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    strokeWidth: 2,
    strokeStyle: "solid",
    fillStyle: "solid",
    opacity: 100,
    roughness: 1,
    fontSize: 20,
    fontFamily: 5,
    textAlign: "left",
    verticalAlign: "top",
    angle: 0,
  },

  // Color palette (ultra-compact)
  COLORS: {
    k: "#1e1e1e", // black
    w: "#ffffff", // white
    r: "#e03131", // red
    g: "#2f9e44", // green
    b: "#1971c2", // blue
    y: "#f59f00", // yellow
    p: "#9c36b5", // purple
    o: "#fd7e14", // orange
    t: "transparent", // transparent
  },
};

// =============================================================================
// BIDIRECTIONAL CONVERTER CLASS - FIXED VERSION
// =============================================================================

class ExcalidrawDSLConverter {
  static generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Generate consistent ID from DSL ID
  static generateConsistentId(dslId: string): string {
    // Create a consistent ID based on DSL ID but in Excalidraw format
    const hash = this.simpleHash(dslId);
    return `${dslId}_${hash}`;
  }

  static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  // EXCALIDRAW → DSL CONVERSION
  // ===========================
  static toDSL(excalidrawElements: ExcalidrawElement[]): DSLElement[] {
    const elements: DSLElement[] = [];
    const elementMap = new Map<string, string>(); // Track Excalidraw IDs for relationships
    const textContainers = new Map<string, string>(); // Track which elements have contained text

    // Filter out deleted elements and build ID map
    const activeElements = excalidrawElements.filter((el) => !el.isDeleted);
    activeElements.forEach((el, index) => {
      // Extract original DSL ID if it exists (from consistent ID format)
      let dslId = `e${index}`;
      if (el.id && el.id.includes("_")) {
        const parts = el.id.split("_");
        if (parts.length >= 2) {
          dslId = parts[0];
        }
      }
      elementMap.set(el.id, dslId);
    });

    // Build map of text elements that are contained in shapes
    activeElements.forEach((element) => {
      if (element.type === "text" && (element as ExcalidrawTextElement).containerId) {
        const textEl = element as ExcalidrawTextElement;
        const containerDslId = elementMap.get(textEl.containerId!);
        if (containerDslId) {
          textContainers.set(containerDslId, textEl.text);
        }
      }
    });

    activeElements.forEach((element, index) => {
      const dslElement = this.convertElementToDSL(
        element,
        elementMap,
        textContainers
      );
      if (dslElement) {
        elements.push(dslElement);
      }
    });

    return elements;
  }

  static convertElementToDSL(
    element: ExcalidrawElement, 
    elementMap: Map<string, string>, 
    textContainers: Map<string, string> = new Map()
  ): DSLElement | null {
    const dslId = elementMap.get(element.id);
    if (!dslId) return null;

    const base: Partial<DSLElement> = {
      id: dslId,
      type: Object.keys(DSL_SCHEMA.TYPES).find(
        (k) => DSL_SCHEMA.TYPES[k as DSLElementType] === element.type
      ) as DSLElementType || element.type as DSLElementType,
      x: Math.round(element.x),
      y: Math.round(element.y),
    };

    // Add inline text if this element has contained text
    if (textContainers.has(dslId)) {
      base.text = textContainers.get(dslId);
    }

    // Add type-specific properties
    switch (element.type) {
      case "rectangle":
      case "ellipse":
      case "diamond":
        (base as DSLRectElement | DSLEllipseElement | DSLDiamondElement).w = Math.round(element.width);
        (base as DSLRectElement | DSLEllipseElement | DSLDiamondElement).h = Math.round(element.height);
        break;

      case "arrow":
        const arrowEl = element as ExcalidrawArrowElement;
        if (arrowEl.points && arrowEl.points.length > 1) {
          const endPoint = arrowEl.points[arrowEl.points.length - 1];
          (base as DSLArrowElement).endX = Math.round(element.x + endPoint[0]);
          (base as DSLArrowElement).endY = Math.round(element.y + endPoint[1]);
        }
        // Preserve bindings
        if (arrowEl.startBinding) {
          (base as DSLArrowElement).startBind = elementMap.get(arrowEl.startBinding.elementId);
        }
        if (arrowEl.endBinding) {
          (base as DSLArrowElement).endBind = elementMap.get(arrowEl.endBinding.elementId);
        }
        break;

      case "line":
      case "freedraw":
        const lineEl = element as ExcalidrawLineElement | ExcalidrawFreedrawElement;
        if (lineEl.points && lineEl.points.length > 0) {
          // Simplify points by removing very close ones
          (base as DSLLineElement | DSLFreedrawElement).points = this.simplifyPoints(lineEl.points);
        }
        break;

      case "text":
        const textEl = element as ExcalidrawTextElement;
        // Only include standalone text elements (not contained in shapes)
        if (textEl.containerId) {
          return null; // Skip contained text as it's already merged with container
        }
        (base as DSLTextElement).text = textEl.text;
        if (textEl.fontSize !== DSL_SCHEMA.DEFAULTS.fontSize) {
          base.fontSize = textEl.fontSize;
        }
        break;
    }

    // Add non-default styling
    this.addStylingProps(base, element);

    return base as DSLElement;
  }

  static simplifyPoints(points: Point[], tolerance: number = 3): Point[] {
    if (!points || points.length <= 2) return points;

    const simplified: Point[] = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      // Keep point if it creates a significant direction change
      const dist = Math.sqrt(
        Math.pow(curr[0] - prev[0], 2) + Math.pow(curr[1] - prev[1], 2)
      );
      if (dist > tolerance) {
        simplified.push(curr);
      }
    }
    simplified.push(points[points.length - 1]);
    return simplified;
  }

  static addStylingProps(base: Partial<DSLElement>, element: ExcalidrawElement): void {
    const defaults = DSL_SCHEMA.DEFAULTS;

    if (element.strokeColor !== defaults.strokeColor) {
      base.stroke =
        this.colorToShorthand(element.strokeColor) || element.strokeColor;
    }
    if (element.backgroundColor !== defaults.backgroundColor) {
      base.fill =
        this.colorToShorthand(element.backgroundColor) ||
        element.backgroundColor;
    }
    if (element.strokeWidth !== defaults.strokeWidth) {
      base.strokeW = element.strokeWidth;
    }
    if (element.angle !== 0) {
      base.angle = Math.round((element.angle * 180) / Math.PI);
    }
  }

  static colorToShorthand(color: string): ColorShorthand | undefined {
    return Object.keys(DSL_SCHEMA.COLORS).find(
      (k) => DSL_SCHEMA.COLORS[k as ColorShorthand] === color
    ) as ColorShorthand | undefined;
  }

  // DSL → EXCALIDRAW CONVERSION - FIXED VERSION WITH INLINE TEXT SUPPORT
  // ====================================================================
  static fromDSL(dslElements: DSLElement[]): ExcalidrawElement[] {
    const excalidrawElements: ExcalidrawElement[] = [];
    const idMap = new Map<string, string>(); // DSL ID → Excalidraw ID
    const elementLookup = new Map<string, ExcalidrawElement>(); // Quick element lookup
    const elementsWithText: ElementWithText[] = []; // Track elements that need text children

    // First pass: create elements and build consistent ID mapping
    dslElements.forEach((dslEl, index) => {
      const dslId = dslEl.id || `e${index}`;
      const excalidrawId = this.generateConsistentId(dslId);
      idMap.set(dslId, excalidrawId);

      const element = this.convertDSLToElement(dslEl, excalidrawId, index);
      if (element) {
        excalidrawElements.push(element);
        elementLookup.set(excalidrawId, element);

        // Track elements that have inline text
        if (dslEl.text && dslEl.type !== "text") {
          elementsWithText.push({
            dslEl,
            element,
            dslId,
            excalidrawId,
          });
        }
      }
    });

    // Create text elements for shapes with inline text
    elementsWithText.forEach(
      ({ dslEl, element, dslId, excalidrawId }, textIndex) => {
        const textId = this.generateConsistentId(`${dslId}_text`);
        const textElement = this.createTextElement(
          dslEl,
          textId,
          element,
          textIndex + dslElements.length
        );

        if (textElement) {
          excalidrawElements.push(textElement);
          elementLookup.set(textId, textElement);

          // Set up the container relationship
          textElement.containerId = excalidrawId;

          // Add bound element to the container
          if (!element.boundElements) {
            element.boundElements = [];
          }
          element.boundElements.push({
            id: textId,
            type: "text",
          });
        }
      }
    );

    // Second pass: resolve bindings and relationships
    dslElements.forEach((dslEl, index) => {
      const dslId = dslEl.id || `e${index}`;
      const excalidrawId = idMap.get(dslId);
      const element = excalidrawId ? elementLookup.get(excalidrawId) : undefined;

      if (!element) return;

      this.resolveRelationships(dslEl, element, idMap, elementLookup);
    });

    return excalidrawElements;
  }

  static createTextElement(
    dslEl: DSLElement, 
    textId: string, 
    containerElement: ExcalidrawElement, 
    index: number
  ): ExcalidrawTextElement | null {
    if (!dslEl.text) return null;

    const fontSize = dslEl.fontSize || DSL_SCHEMA.DEFAULTS.fontSize;
    const text = dslEl.text;

    // Calculate text dimensions
    const lines = text.split("\n");
    const maxLength = Math.max(...lines.map((line) => line.length));
    const textWidth = maxLength * fontSize * 0.6;
    const textHeight = lines.length * fontSize * 1.25;

    // Center the text within the container
    const textX = containerElement.x + (containerElement.width - textWidth) / 2;
    const textY = containerElement.y + (containerElement.height - textHeight) / 2;

    return {
      id: textId,
      type: "text",
      x: textX,
      y: textY,
      width: textWidth,
      height: textHeight,
      angle: containerElement.angle || 0,
      strokeColor: dslEl.stroke
        ? (this.resolveColor(dslEl.stroke) || DSL_SCHEMA.DEFAULTS.strokeColor)
        : DSL_SCHEMA.DEFAULTS.strokeColor,
      backgroundColor: "transparent",
      fillStyle: DSL_SCHEMA.DEFAULTS.fillStyle,
      strokeWidth: DSL_SCHEMA.DEFAULTS.strokeWidth,
      strokeStyle: DSL_SCHEMA.DEFAULTS.strokeStyle,
      roughness: DSL_SCHEMA.DEFAULTS.roughness,
      opacity: DSL_SCHEMA.DEFAULTS.opacity,
      groupIds: [],
      frameId: null,
      index: `a${index}`,
      seed: Math.floor(Math.random() * 2000000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2000000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      text: text,
      fontSize: fontSize,
      fontFamily: DSL_SCHEMA.DEFAULTS.fontFamily,
      textAlign: "center",
      verticalAlign: "middle",
      containerId: null, // Will be set by caller
      originalText: text,
      autoResize: true,
      lineHeight: 1.25,
    };
  }

  static convertDSLToElement(dslEl: DSLElement, id: string, index: number): ExcalidrawElement | null {
    const elementType = DSL_SCHEMA.TYPES[dslEl.type] || dslEl.type as ExcalidrawElementType;

    // Base element structure
    const element: Partial<ExcalidrawElement> = {
      id: id, // Use the consistent ID generated from DSL ID
      type: elementType,
      x: dslEl.x || 0,
      y: dslEl.y || 0,
      angle: ((dslEl.angle || 0) * Math.PI) / 180,
      strokeColor:
        this.resolveColor(dslEl.stroke) || DSL_SCHEMA.DEFAULTS.strokeColor,
      backgroundColor:
        this.resolveColor(dslEl.fill) || DSL_SCHEMA.DEFAULTS.backgroundColor,
      fillStyle: DSL_SCHEMA.DEFAULTS.fillStyle,
      strokeWidth: dslEl.strokeW || DSL_SCHEMA.DEFAULTS.strokeWidth,
      strokeStyle: DSL_SCHEMA.DEFAULTS.strokeStyle,
      roughness: DSL_SCHEMA.DEFAULTS.roughness,
      opacity: DSL_SCHEMA.DEFAULTS.opacity,
      groupIds: [],
      frameId: null,
      index: `a${index}`,
      seed: Math.floor(Math.random() * 2000000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2000000000),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      width: 0, // Will be set by type-specific function
      height: 0, // Will be set by type-specific function
    };

    // Add type-specific properties
    this.addTypeSpecificProperties(element, dslEl, elementType);

    return element as ExcalidrawElement;
  }

  static resolveColor(colorRef?: ColorShorthand | string): string | null {
    if (!colorRef) return null;
    return DSL_SCHEMA.COLORS[colorRef as ColorShorthand] || colorRef;
  }

  static addTypeSpecificProperties(
    element: Partial<ExcalidrawElement>, 
    dslEl: DSLElement, 
    elementType: ExcalidrawElementType
  ): void {
    switch (elementType) {
      case "rectangle":
        const rectEl = element as Partial<ExcalidrawShapeElement>;
        const rectDsl = dslEl as DSLRectElement;
        rectEl.width = rectDsl.w || 100;
        rectEl.height = rectDsl.h || 100;
        rectEl.roundness = { type: 3 };
        break;

      case "ellipse":
        const ellipseEl = element as Partial<ExcalidrawShapeElement>;
        const ellipseDsl = dslEl as DSLEllipseElement;
        ellipseEl.width = ellipseDsl.w || 100;
        ellipseEl.height = ellipseDsl.h || 100;
        ellipseEl.roundness = { type: 2 };
        break;

      case "diamond":
        const diamondEl = element as Partial<ExcalidrawShapeElement>;
        const diamondDsl = dslEl as DSLDiamondElement;
        diamondEl.width = diamondDsl.w || 100;
        diamondEl.height = diamondDsl.h || 100;
        diamondEl.roundness = { type: 2 };
        break;

      case "arrow":
        const arrowEl = element as Partial<ExcalidrawArrowElement>;
        const arrowDsl = dslEl as DSLArrowElement;
        const endX = arrowDsl.endX || element.x! + 100;
        const endY = arrowDsl.endY || element.y!;
        arrowEl.width = Math.abs(endX - element.x!);
        arrowEl.height = Math.abs(endY - element.y!);
        arrowEl.points = [
          [0, 0],
          [endX - element.x!, endY - element.y!],
        ];
        arrowEl.roundness = { type: 2 };
        arrowEl.startArrowhead = null;
        arrowEl.endArrowhead = "arrow";
        arrowEl.startBinding = null;
        arrowEl.endBinding = null;
        arrowEl.lastCommittedPoint = null;
        arrowEl.elbowed = false;
        break;

      case "line":
        const lineEl = element as Partial<ExcalidrawLineElement>;
        const lineDsl = dslEl as DSLLineElement;
        lineEl.points = lineDsl.points || [
          [0, 0],
          [100, 0],
        ];
        lineEl.roundness = { type: 2 };
        lineEl.startBinding = null;
        lineEl.endBinding = null;
        lineEl.startArrowhead = null;
        lineEl.endArrowhead = null;
        lineEl.lastCommittedPoint = null;
        this.calculateBounds(element as ExcalidrawLineElement);
        break;

      case "freedraw":
        const freedrawEl = element as Partial<ExcalidrawFreedrawElement>;
        const freedrawDsl = dslEl as DSLFreedrawElement;
        freedrawEl.points = freedrawDsl.points || [
          [0, 0],
          [50, 25],
          [100, 0],
        ];
        freedrawEl.roundness = null;
        freedrawEl.pressures = [];
        freedrawEl.simulatePressure = true;
        freedrawEl.lastCommittedPoint = freedrawEl.points[freedrawEl.points.length - 1];
        this.calculateBounds(element as ExcalidrawFreedrawElement);
        break;

      case "text":
        const textEl = element as Partial<ExcalidrawTextElement>;
        const textDsl = dslEl as DSLTextElement;
        textEl.text = textDsl.text || "Text";
        textEl.fontSize = textDsl.fontSize || DSL_SCHEMA.DEFAULTS.fontSize;
        textEl.fontFamily = DSL_SCHEMA.DEFAULTS.fontFamily;
        textEl.textAlign = DSL_SCHEMA.DEFAULTS.textAlign;
        textEl.verticalAlign = textDsl.container
          ? "middle"
          : DSL_SCHEMA.DEFAULTS.verticalAlign;
        textEl.containerId = null; // Will be resolved in second pass
        textEl.originalText = textEl.text;
        textEl.autoResize = true;
        textEl.lineHeight = 1.25;

        // Estimate text dimensions
        const lines = textEl.text.split("\n");
        const maxLength = Math.max(...lines.map((line) => line.length));
        textEl.width = maxLength * textEl.fontSize * 0.6;
        textEl.height = lines.length * textEl.fontSize * 1.25;
        break;
    }
  }

  static calculateBounds(element: Partial<ExcalidrawLineElement | ExcalidrawFreedrawElement>): void {
    const points = (element as ExcalidrawLineElement | ExcalidrawFreedrawElement).points;
    if (!points || points.length === 0) {
      element.width = 0;
      element.height = 0;
      return;
    }

    let minX = points[0][0], maxX = points[0][0];
    let minY = points[0][1], maxY = points[0][1];

    points.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    element.width = Math.abs(maxX - minX);
    element.height = Math.abs(maxY - minY);
  }

  // FIXED: Proper relationship resolution with bound element tracking
  static resolveRelationships(
    dslEl: DSLElement, 
    element: ExcalidrawElement, 
    idMap: Map<string, string>, 
    elementLookup: Map<string, ExcalidrawElement>
  ): void {
    // Resolve arrow bindings
    if (element.type === "arrow") {
      const arrowEl = element as ExcalidrawArrowElement;
      const arrowDsl = dslEl as DSLArrowElement;

      if (arrowDsl.startBind && idMap.has(arrowDsl.startBind)) {
        const targetId = idMap.get(arrowDsl.startBind)!;
        const targetElement = elementLookup.get(targetId);

        arrowEl.startBinding = {
          elementId: targetId,
          focus: 0,
          gap: 1,
        };

        // Add this arrow to the target element's boundElements
        if (targetElement) {
          if (!targetElement.boundElements) {
            targetElement.boundElements = [];
          }
          targetElement.boundElements.push({
            id: element.id,
            type: "arrow",
          });
        }
      }
    }

    // Resolve text containers (for standalone text elements with container property)
    if (
      element.type === "text" &&
      (dslEl as DSLTextElement).container &&
      idMap.has((dslEl as DSLTextElement).container!)
    ) {
      const textEl = element as ExcalidrawTextElement;
      const textDsl = dslEl as DSLTextElement;
      const containerId = idMap.get(textDsl.container!)!;
      const containerElement = elementLookup.get(containerId);

      textEl.containerId = containerId;
      textEl.textAlign = "center";
      textEl.verticalAlign = "middle";

      // Add this text to the container's boundElements
      if (containerElement) {
        if (!containerElement.boundElements) {
          containerElement.boundElements = [];
        }
        containerElement.boundElements.push({
          id: element.id,
          type: "text",
        });

        // Center the text within the container
        textEl.x =
          containerElement.x + (containerElement.width - textEl.width) / 2;
        textEl.y =
          containerElement.y + (containerElement.height - textEl.height) / 2;
      }
    }
  }
}

// =============================================================================
// ENHANCED TESTING & VALIDATION WITH INLINE TEXT
// =============================================================================

// Test ID preservation, relationship integrity, and inline text handling
function testInlineTextHandling(): TestResult {
  console.log("=== INLINE TEXT HANDLING TEST ===");

  const testDSL: DSLElement[] = [
    {
      id: "box1",
      type: "rect",
      x: 100,
      y: 100,
      w: 120,
      h: 80,
      fill: "g",
      text: "Process A",
    } as DSLRectElement,
    {
      id: "box2",
      type: "rect",
      x: 300,
      y: 100,
      w: 120,
      h: 80,
      fill: "b",
      text: "Process B",
    } as DSLRectElement,
    {
      id: "circle1",
      type: "ellipse",
      x: 100,
      y: 250,
      w: 100,
      h: 100,
      fill: "y",
      text: "Start",
    } as DSLEllipseElement,
    {
      id: "arrow1",
      type: "arrow",
      x: 220,
      y: 140,
      endX: 300,
      endY: 140,
      startBind: "box1",
      endBind: "box2",
    } as DSLArrowElement,
    {
      id: "standalone",
      type: "text",
      x: 50,
      y: 50,
      text: "Standalone Text",
      fontSize: 16,
    } as DSLTextElement,
  ];

  console.log(
    "Original DSL with inline text:",
    JSON.stringify(testDSL, null, 2)
  );

  // Convert to Excalidraw
  const excalidrawElements = ExcalidrawDSLConverter.fromDSL(testDSL);
  console.log(`Generated ${excalidrawElements.length} Excalidraw elements`);

  // Check for text elements
  const textElements = excalidrawElements.filter((el) => el.type === "text");
  console.log(`Found ${textElements.length} text elements:`);
  textElements.forEach((el) => {
    const textEl = el as ExcalidrawTextElement;
    console.log(`- Text: "${textEl.text}", Container: ${textEl.containerId || "none"}`);
  });

  // Convert back to DSL
  const convertedDSL = ExcalidrawDSLConverter.toDSL(excalidrawElements);
  console.log("Converted back DSL:", JSON.stringify(convertedDSL, null, 2));

  // Verify text preservation
  const originalShapesWithText = testDSL.filter(
    (el) => el.text && el.type !== "text"
  );
  const convertedShapesWithText = convertedDSL.filter(
    (el) => el.text && el.type !== "text"
  );

  console.log("Text preservation check:", {
    originalCount: originalShapesWithText.length,
    convertedCount: convertedShapesWithText.length,
    allTextPreserved: originalShapesWithText.every((orig) =>
      convertedShapesWithText.find(
        (conv) => conv.id === orig.id && conv.text === orig.text
      )
    ),
  });

  return {
    original: testDSL,
    excalidraw: excalidrawElements,
    converted: convertedDSL,
  };
}

// Enhanced DSL examples with inline text
const ENHANCED_DSL_EXAMPLES: EnhancedDSLExamples = {
  // Flowchart with inline text in shapes
  flowchartWithInlineText: [
    {
      id: "start",
      type: "ellipse",
      x: 200,
      y: 50,
      w: 120,
      h: 60,
      fill: "g",
      text: "Start",
    } as DSLEllipseElement,
    {
      id: "process1",
      type: "rect",
      x: 200,
      y: 150,
      w: 120,
      h: 80,
      fill: "b",
      text: "Process Data",
    } as DSLRectElement,
    {
      id: "decision",
      type: "diamond",
      x: 200,
      y: 280,
      w: 120,
      h: 100,
      fill: "y",
      text: "Valid?",
    } as DSLDiamondElement,
    {
      id: "process2",
      type: "rect",
      x: 50,
      y: 420,
      w: 120,
      h: 80,
      fill: "b",
      text: "Handle Error",
    } as DSLRectElement,
    {
      id: "end",
      type: "ellipse",
      x: 350,
      y: 420,
      w: 120,
      h: 60,
      fill: "r",
      text: "End",
    } as DSLEllipseElement,

    // Arrows with proper bindings
    {
      id: "a1",
      type: "arrow",
      x: 260,
      y: 110,
      endX: 260,
      endY: 150,
      startBind: "start",
      endBind: "process1",
    } as DSLArrowElement,
    {
      id: "a2",
      type: "arrow",
      x: 260,
      y: 230,
      endX: 260,
      endY: 280,
      startBind: "process1",
      endBind: "decision",
    } as DSLArrowElement,
    {
      id: "a3",
      type: "arrow",
      x: 200,
      y: 340,
      endX: 110,
      endY: 420,
      startBind: "decision",
      endBind: "process2",
    } as DSLArrowElement,
    {
      id: "a4",
      type: "arrow",
      x: 320,
      y: 340,
      endX: 410,
      endY: 420,
      startBind: "decision",
      endBind: "end",
    } as DSLArrowElement,

    // Labels for decision branches
    { 
      id: "label_no", 
      type: "text", 
      x: 130, 
      y: 360, 
      text: "No", 
      fontSize: 14 
    } as DSLTextElement,
    {
      id: "label_yes",
      type: "text",
      x: 340,
      y: 360,
      text: "Yes",
      fontSize: 14,
    } as DSLTextElement,
  ],

  // Mixed inline and container text
  mixedTextExample: [
    {
      id: "shape1",
      type: "rect",
      x: 100,
      y: 100,
      w: 150,
      h: 80,
      fill: "b",
      text: "Inline Text",
    } as DSLRectElement,
    { 
      id: "shape2", 
      type: "ellipse", 
      x: 300, 
      y: 100, 
      w: 120, 
      h: 80, 
      fill: "g" 
    } as DSLEllipseElement,
    {
      id: "container_text",
      type: "text",
      x: 340,
      y: 130,
      text: "Container Text",
      container: "shape2",
    } as DSLTextElement,
    {
      id: "free_text",
      type: "text",
      x: 200,
      y: 50,
      text: "Free Text",
      fontSize: 16,
    } as DSLTextElement,
  ],
};

export default ExcalidrawDSLConverter;

// Export types for external usage
export type {
  DSLElement,
  DSLElementType,
  ExcalidrawElement,
  ExcalidrawElementType,
  DSLRectElement,
  DSLEllipseElement,
  DSLDiamondElement,
  DSLArrowElement,
  DSLLineElement,
  DSLFreedrawElement,
  DSLTextElement,
  ExcalidrawShapeElement,
  ExcalidrawArrowElement,
  ExcalidrawLineElement,
  ExcalidrawFreedrawElement,
  ExcalidrawTextElement,
  Point,
  ColorShorthand,
  TestResult,
  EnhancedDSLExamples,
};

// Export everything for CommonJS compatibility
declare const module: any;
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ExcalidrawDSLConverter,
    DSL_SCHEMA,
    ENHANCED_DSL_EXAMPLES,
    testInlineTextHandling,
  };
}


// Create DSLJson interface using the existing types
export interface DSLJson {
  elements: DSLElement[];
  flows: DSLFlow[];
  layout: DSLLayout;
}

// Define DSLFlow and DSLLayout types that were missing
export interface DSLFlow {
  from: string;
  to: string;
}

export type DSLLayout = string;
