// =============================================================================
// EXCALIDRAW ↔ DSL BIDIRECTIONAL CONVERSION SYSTEM - FIXED ID PRESERVATION & TEXT HANDLING
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
    const textContainers = new Map(); // Track which elements have contained text

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
      if (element.type === "text" && element.containerId) {
        const containerDslId = elementMap.get(element.containerId);
        if (containerDslId) {
          textContainers.set(containerDslId, element.text);
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

  static convertElementToDSL(element, elementMap, textContainers = new Map()) {
    const base = {
      id: elementMap.get(element.id),
      type:
        Object.keys(DSL_SCHEMA.TYPES).find(
          (k) => DSL_SCHEMA.TYPES[k] === element.type
        ) || element.type,
      x: Math.round(element.x),
      y: Math.round(element.y),
    };

    // Add inline text if this element has contained text
    const dslId = elementMap.get(element.id);
    if (textContainers.has(dslId)) {
      base.text = textContainers.get(dslId);
    }

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
        // Only include standalone text elements (not contained in shapes)
        if (element.containerId) {
          return null; // Skip contained text as it's already merged with container
        }
        base.text = element.text;
        if (element.fontSize !== DSL_SCHEMA.DEFAULTS.fontSize) {
          base.fontSize = element.fontSize;
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

  // DSL → EXCALIDRAW CONVERSION - FIXED VERSION WITH INLINE TEXT SUPPORT
  // ====================================================================
  static fromDSL(dslElements) {
    const excalidrawElements = [];
    const idMap = new Map(); // DSL ID → Excalidraw ID
    const elementLookup = new Map(); // Quick element lookup
    const elementsWithText = []; // Track elements that need text children

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
      const element = elementLookup.get(excalidrawId);

      if (!element) return;

      this.resolveRelationships(dslEl, element, idMap, elementLookup);
    });

    return excalidrawElements;
  }

  static createTextElement(dslEl, textId, containerElement, index) {
    const fontSize = dslEl.fontSize || DSL_SCHEMA.DEFAULTS.fontSize;
    const text = dslEl.text || "";

    // Calculate text dimensions
    const lines = text.split("\n");
    const maxLength = Math.max(...lines.map((line) => line.length));
    const textWidth = maxLength * fontSize * 0.6;
    const textHeight = lines.length * fontSize * 1.25;

    // Center the text within the container
    const textX = containerElement.x + (containerElement.width - textWidth) / 2;
    const textY =
      containerElement.y + (containerElement.height - textHeight) / 2;

    return {
      id: textId,
      type: "text",
      x: textX,
      y: textY,
      width: textWidth,
      height: textHeight,
      angle: containerElement.angle || 0,
      strokeColor: dslEl.stroke
        ? this.resolveColor(dslEl.stroke)
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

    // Resolve text containers (for standalone text elements with container property)
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
// ENHANCED TESTING & VALIDATION WITH INLINE TEXT
// =============================================================================

// Test ID preservation, relationship integrity, and inline text handling
function testInlineTextHandling() {
  console.log("=== INLINE TEXT HANDLING TEST ===");

  const testDSL = [
    {
      id: "box1",
      type: "rect",
      x: 100,
      y: 100,
      w: 120,
      h: 80,
      fill: "g",
      text: "Process A",
    },
    {
      id: "box2",
      type: "rect",
      x: 300,
      y: 100,
      w: 120,
      h: 80,
      fill: "b",
      text: "Process B",
    },
    {
      id: "circle1",
      type: "ellipse",
      x: 100,
      y: 250,
      w: 100,
      h: 100,
      fill: "y",
      text: "Start",
    },
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
      id: "standalone",
      type: "text",
      x: 50,
      y: 50,
      text: "Standalone Text",
      fontSize: 16,
    },
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
    console.log(`- Text: "${el.text}", Container: ${el.containerId || "none"}`);
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
const ENHANCED_DSL_EXAMPLES = {
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
    },
    {
      id: "process1",
      type: "rect",
      x: 200,
      y: 150,
      w: 120,
      h: 80,
      fill: "b",
      text: "Process Data",
    },
    {
      id: "decision",
      type: "diamond",
      x: 200,
      y: 280,
      w: 120,
      h: 100,
      fill: "y",
      text: "Valid?",
    },
    {
      id: "process2",
      type: "rect",
      x: 50,
      y: 420,
      w: 120,
      h: 80,
      fill: "b",
      text: "Handle Error",
    },
    {
      id: "end",
      type: "ellipse",
      x: 350,
      y: 420,
      w: 120,
      h: 60,
      fill: "r",
      text: "End",
    },

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

    // Labels for decision branches
    { id: "label_no", type: "text", x: 130, y: 360, text: "No", fontSize: 14 },
    {
      id: "label_yes",
      type: "text",
      x: 340,
      y: 360,
      text: "Yes",
      fontSize: 14,
    },
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
    },
    { id: "shape2", type: "ellipse", x: 300, y: 100, w: 120, h: 80, fill: "g" },
    {
      id: "container_text",
      type: "text",
      x: 340,
      y: 130,
      text: "Container Text",
      container: "shape2",
    },
    {
      id: "free_text",
      type: "text",
      x: 200,
      y: 50,
      text: "Free Text",
      fontSize: 16,
    },
  ],
};

export default ExcalidrawDSLConverter;

// Export everything
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ExcalidrawDSLConverter,
    DSL_SCHEMA,
    ENHANCED_DSL_EXAMPLES,
    testInlineTextHandling,
  };
}

// Run the test
// console.log("Running inline text handling test...");
// testInlineTextHandling();
