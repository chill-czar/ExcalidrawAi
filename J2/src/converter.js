// =============================================================================
// EXCALIDRAW ↔ DSL BIDIRECTIONAL CONVERSION SYSTEM - FIXED ID PRESERVATION
// =============================================================================

// ENHANCED DSL SCHEMA WITH RELATIONSHIPS & BINDINGS
// =================================================
const DSL_SCHEMA = {
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
  static generateId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Generate consistent ID from DSL ID
  static generateConsistentId(dslId) {
    // Create a consistent ID based on DSL ID but in Excalidraw format
    const hash = this.simpleHash(dslId);
    return `${dslId}_${hash}`;
  }

  static simpleHash(str) {
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
  static toDSL(excalidrawElements) {
    const elements = [];
    const elementMap = new Map(); // Track Excalidraw IDs for relationships

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

    activeElements.forEach((element, index) => {
      const dslElement = this.convertElementToDSL(element, elementMap);
      if (dslElement) {
        elements.push(dslElement);
      }
    });

    return elements;
  }

  static convertElementToDSL(element, elementMap) {
    const base = {
      id: elementMap.get(element.id),
      type:
        Object.keys(DSL_SCHEMA.TYPES).find(
          (k) => DSL_SCHEMA.TYPES[k] === element.type
        ) || element.type,
      x: Math.round(element.x),
      y: Math.round(element.y),
    };

    // Add type-specific properties
    switch (element.type) {
      case "rectangle":
      case "ellipse":
      case "diamond":
        base.w = Math.round(element.width);
        base.h = Math.round(element.height);
        break;

      case "arrow":
        if (element.points && element.points.length > 1) {
          const endPoint = element.points[element.points.length - 1];
          base.endX = Math.round(element.x + endPoint[0]);
          base.endY = Math.round(element.y + endPoint[1]);
        }
        // Preserve bindings
        if (element.startBinding) {
          base.startBind = elementMap.get(element.startBinding.elementId);
        }
        if (element.endBinding) {
          base.endBind = elementMap.get(element.endBinding.elementId);
        }
        break;

      case "line":
      case "freedraw":
        if (element.points && element.points.length > 0) {
          // Simplify points by removing very close ones
          base.points = this.simplifyPoints(element.points);
        }
        break;

      case "text":
        base.text = element.text;
        if (element.fontSize !== DSL_SCHEMA.DEFAULTS.fontSize) {
          base.fontSize = element.fontSize;
        }
        if (element.containerId) {
          base.container = elementMap.get(element.containerId);
        }
        break;
    }

    // Add non-default styling
    this.addStylingProps(base, element);

    return base;
  }

  static simplifyPoints(points, tolerance = 3) {
    if (!points || points.length <= 2) return points;

    const simplified = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

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

  static addStylingProps(base, element) {
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

  static colorToShorthand(color) {
    return Object.keys(DSL_SCHEMA.COLORS).find(
      (k) => DSL_SCHEMA.COLORS[k] === color
    );
  }

  // DSL → EXCALIDRAW CONVERSION - FIXED VERSION
  // =============================================
  static fromDSL(dslElements) {
    const excalidrawElements = [];
    const idMap = new Map(); // DSL ID → Excalidraw ID
    const elementLookup = new Map(); // Quick element lookup

    // First pass: create elements and build consistent ID mapping
    dslElements.forEach((dslEl, index) => {
      const dslId = dslEl.id || `e${index}`;
      const excalidrawId = this.generateConsistentId(dslId);
      idMap.set(dslId, excalidrawId);

      const element = this.convertDSLToElement(dslEl, excalidrawId, index);
      if (element) {
        excalidrawElements.push(element);
        elementLookup.set(excalidrawId, element);
      }
    });

    // Second pass: resolve bindings and relationships
    dslElements.forEach((dslEl, index) => {
      const dslId = dslEl.id || `e${index}`;
      const excalidrawId = idMap.get(dslId);
      const element = elementLookup.get(excalidrawId);

      if (!element) return;

      this.resolveRelationships(dslEl, element, idMap, elementLookup);
    });

    return excalidrawElements;
  }

  static convertDSLToElement(dslEl, id, index) {
    const elementType = DSL_SCHEMA.TYPES[dslEl.type] || dslEl.type;

    // Base element structure
    const element = {
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
    };

    // Add type-specific properties
    this.addTypeSpecificProperties(element, dslEl, elementType);

    return element;
  }

  static resolveColor(colorRef) {
    if (!colorRef) return null;
    return DSL_SCHEMA.COLORS[colorRef] || colorRef;
  }

  static addTypeSpecificProperties(element, dslEl, elementType) {
    switch (elementType) {
      case "rectangle":
        element.width = dslEl.w || 100;
        element.height = dslEl.h || 100;
        element.roundness = { type: 3 };
        break;

      case "ellipse":
        element.width = dslEl.w || 100;
        element.height = dslEl.h || 100;
        element.roundness = { type: 2 };
        break;

      case "diamond":
        element.width = dslEl.w || 100;
        element.height = dslEl.h || 100;
        element.roundness = { type: 2 };
        break;

      case "arrow":
        const endX = dslEl.endX || element.x + 100;
        const endY = dslEl.endY || element.y;
        element.width = Math.abs(endX - element.x);
        element.height = Math.abs(endY - element.y);
        element.points = [
          [0, 0],
          [endX - element.x, endY - element.y],
        ];
        element.roundness = { type: 2 };
        element.startArrowhead = null;
        element.endArrowhead = "arrow";
        element.startBinding = null;
        element.endBinding = null;
        element.lastCommittedPoint = null;
        element.elbowed = false;
        break;

      case "line":
        element.points = dslEl.points || [
          [0, 0],
          [100, 0],
        ];
        element.roundness = { type: 2 };
        element.startBinding = null;
        element.endBinding = null;
        element.startArrowhead = null;
        element.endArrowhead = null;
        element.lastCommittedPoint = null;
        this.calculateBounds(element);
        break;

      case "freedraw":
        element.points = dslEl.points || [
          [0, 0],
          [50, 25],
          [100, 0],
        ];
        element.roundness = null;
        element.pressures = [];
        element.simulatePressure = true;
        element.lastCommittedPoint = element.points[element.points.length - 1];
        this.calculateBounds(element);
        break;

      case "text":
        element.text = dslEl.text || "Text";
        element.fontSize = dslEl.fontSize || DSL_SCHEMA.DEFAULTS.fontSize;
        element.fontFamily = DSL_SCHEMA.DEFAULTS.fontFamily;
        element.textAlign = DSL_SCHEMA.DEFAULTS.textAlign;
        element.verticalAlign = dslEl.container
          ? "middle"
          : DSL_SCHEMA.DEFAULTS.verticalAlign;
        element.containerId = null; // Will be resolved in second pass
        element.originalText = element.text;
        element.autoResize = true;
        element.lineHeight = 1.25;

        // Estimate text dimensions
        const lines = element.text.split("\n");
        const maxLength = Math.max(...lines.map((line) => line.length));
        element.width = maxLength * element.fontSize * 0.6;
        element.height = lines.length * element.fontSize * 1.25;
        break;
    }
  }

  static calculateBounds(element) {
    if (!element.points || element.points.length === 0) {
      element.width = 0;
      element.height = 0;
      return;
    }

    let minX = element.points[0][0],
      maxX = element.points[0][0];
    let minY = element.points[0][1],
      maxY = element.points[0][1];

    element.points.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    element.width = Math.abs(maxX - minX);
    element.height = Math.abs(maxY - minY);
  }

  // FIXED: Proper relationship resolution with bound element tracking
  static resolveRelationships(dslEl, element, idMap, elementLookup) {
    // Resolve arrow bindings
    if (element.type === "arrow") {
      if (dslEl.startBind && idMap.has(dslEl.startBind)) {
        const targetId = idMap.get(dslEl.startBind);
        const targetElement = elementLookup.get(targetId);

        element.startBinding = {
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

      if (dslEl.endBind && idMap.has(dslEl.endBind)) {
        const targetId = idMap.get(dslEl.endBind);
        const targetElement = elementLookup.get(targetId);

        element.endBinding = {
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

    // Resolve text containers
    if (
      element.type === "text" &&
      dslEl.container &&
      idMap.has(dslEl.container)
    ) {
      const containerId = idMap.get(dslEl.container);
      const containerElement = elementLookup.get(containerId);

      element.containerId = containerId;
      element.textAlign = "center";
      element.verticalAlign = "middle";

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
        element.x =
          containerElement.x + (containerElement.width - element.width) / 2;
        element.y =
          containerElement.y + (containerElement.height - element.height) / 2;
      }
    }
  }
}

// =============================================================================
// ENHANCED TESTING & VALIDATION
// =============================================================================

// Test ID preservation and relationship integrity
function testIDPreservation() {
  console.log("=== ID PRESERVATION & RELATIONSHIP TEST ===");

  const testDSL = [
    { id: "box1", type: "rect", x: 100, y: 100, w: 120, h: 80, fill: "g" },
    { id: "box2", type: "rect", x: 300, y: 100, w: 120, h: 80, fill: "b" },
    {
      id: "arrow1",
      type: "arrow",
      x: 220,
      y: 140,
      endX: 300,
      endY: 140,
      startBind: "box1",
      endBind: "box2",
    },
    {
      id: "text1",
      type: "text",
      x: 130,
      y: 130,
      text: "Start",
      container: "box1",
    },
    {
      id: "text2",
      type: "text",
      x: 330,
      y: 130,
      text: "End",
      container: "box2",
    },
  ];

  console.log("Original DSL:", JSON.stringify(testDSL, null, 2));

  // Convert to Excalidraw
  const excalidrawElements = ExcalidrawDSLConverter.fromDSL(testDSL);
  console.log(
    "Generated Excalidraw IDs:",
    excalidrawElements.map((el) => ({
      dslId: el.id.split("_")[0],
      excalidrawId: el.id,
    }))
  );

  // Check bindings
  const arrowElement = excalidrawElements.find((el) =>
    el.id.startsWith("arrow1")
  );
  console.log("Arrow bindings:", {
    startBinding: arrowElement?.startBinding,
    endBinding: arrowElement?.endBinding,
  });

  // Check text containers
  const textElements = excalidrawElements.filter((el) => el.type === "text");
  console.log(
    "Text containers:",
    textElements.map((el) => ({ id: el.id, containerId: el.containerId }))
  );

  // Convert back to DSL
  const convertedDSL = ExcalidrawDSLConverter.toDSL(excalidrawElements);
  console.log("Converted back DSL:", JSON.stringify(convertedDSL, null, 2));

  // Verify relationship integrity
  const originalArrow = testDSL.find((el) => el.id === "arrow1");
  const convertedArrow = convertedDSL.find((el) => el.id === "arrow1");

  console.log("Relationship integrity check:", {
    originalBindings: {
      start: originalArrow?.startBind,
      end: originalArrow?.endBind,
    },
    convertedBindings: {
      start: convertedArrow?.startBind,
      end: convertedArrow?.endBind,
    },
    intact:
      originalArrow?.startBind === convertedArrow?.startBind &&
      originalArrow?.endBind === convertedArrow?.endBind,
  });

  return {
    original: testDSL,
    excalidraw: excalidrawElements,
    converted: convertedDSL,
  };
}

// Enhanced DSL examples with proper relationships
const ENHANCED_DSL_EXAMPLES = {
  // Flowchart with preserved relationships
  flowchartWithBindings: [
    { id: "start", type: "ellipse", x: 200, y: 50, w: 120, h: 60, fill: "g" },
    { id: "process1", type: "rect", x: 200, y: 150, w: 120, h: 80, fill: "b" },
    {
      id: "decision",
      type: "diamond",
      x: 200,
      y: 280,
      w: 120,
      h: 100,
      fill: "y",
    },
    { id: "process2", type: "rect", x: 50, y: 420, w: 120, h: 80, fill: "b" },
    { id: "end", type: "ellipse", x: 350, y: 420, w: 120, h: 60, fill: "r" },

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
    },
    {
      id: "a2",
      type: "arrow",
      x: 260,
      y: 230,
      endX: 260,
      endY: 280,
      startBind: "process1",
      endBind: "decision",
    },
    {
      id: "a3",
      type: "arrow",
      x: 200,
      y: 340,
      endX: 110,
      endY: 420,
      startBind: "decision",
      endBind: "process2",
    },
    {
      id: "a4",
      type: "arrow",
      x: 320,
      y: 340,
      endX: 410,
      endY: 420,
      startBind: "decision",
      endBind: "end",
    },

    // Text with container bindings
    {
      id: "t1",
      type: "text",
      x: 240,
      y: 75,
      text: "Start",
      container: "start",
    },
    {
      id: "t2",
      type: "text",
      x: 230,
      y: 185,
      text: "Process",
      container: "process1",
    },
    {
      id: "t3",
      type: "text",
      x: 240,
      y: 325,
      text: "Done?",
      container: "decision",
    },
    {
      id: "t4",
      type: "text",
      x: 80,
      y: 455,
      text: "Retry",
      container: "process2",
    },
    { id: "t5", type: "text", x: 395, y: 445, text: "End", container: "end" },

    // Labels for decision branches
    { id: "t6", type: "text", x: 130, y: 360, text: "No", fontSize: 14 },
    { id: "t7", type: "text", x: 340, y: 360, text: "Yes", fontSize: 14 },
  ],
};
export default ExcalidrawDSLConverter;

// Export everything
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ExcalidrawDSLConverter,
    DSL_SCHEMA,
    ENHANCED_DSL_EXAMPLES,
    testIDPreservation,
  };
}

// Run the test
// console.log("Running ID preservation test...");
// testIDPreservation();
