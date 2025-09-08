// =============================================================================
// EXCALIDRAW ↔ DSL CONVERSION SYSTEM
// =============================================================================

// DSL SCHEMA DEFINITION
// =====================
const DSL_SCHEMA = {
  // Ultra-compact format: [type, x, y, width, height, ...typeSpecificProps]
  // Common props can be omitted (uses defaults)

  // Shape Type Mappings (1 char each for max compression)
  TYPES: {
    r: "rectangle", // [r, x, y, w, h, stroke?, fill?, strokeW?, round?]
    e: "ellipse", // [e, x, y, w, h, stroke?, fill?, strokeW?]
    d: "diamond", // [d, x, y, w, h, stroke?, fill?, strokeW?]
    a: "arrow", // [a, x, y, endX, endY, stroke?, strokeW?]
    l: "line", // [l, x, y, points[], stroke?, strokeW?]
    f: "freedraw", // [f, x, y, points[], stroke?, strokeW?]
    t: "text", // [t, x, y, text, fontSize?, fontFamily?, stroke?, align?]
  },

  // Default values (omitted props use these)
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
    roundness: null,
  },

  // Color shortcuts (1-2 chars)
  COLORS: {
    k: "#1e1e1e", // black
    w: "#ffffff", // white
    r: "#e03131", // red
    g: "#2f9e44", // green
    b: "#1971c2", // blue
    y: "#f59f00", // yellow
    p: "#9c36b5", // purple
    t: "transparent", // transparent
  },
};

// =============================================================================
// CORE CONVERSION FUNCTIONS
// =============================================================================

class ExcalidrawDSLConverter {
  // Generate unique IDs
  static generateId() {
    return Math.random().toString(36).substring(2, 15);
  }

  // EXCALIDRAW → DSL CONVERSION
  static toDSL(excalidrawElements) {
    const dslElements = [];

    excalidrawElements.forEach((element) => {
      if (element.isDeleted) return; // Skip deleted elements

      let dslElement;

      switch (element.type) {
        case "rectangle":
          dslElement = [
            "r",
            element.x,
            element.y,
            element.width,
            element.height,
          ];
          break;

        case "ellipse":
          dslElement = [
            "e",
            element.x,
            element.y,
            element.width,
            element.height,
          ];
          break;

        case "diamond":
          dslElement = [
            "d",
            element.x,
            element.y,
            element.width,
            element.height,
          ];
          break;

        case "arrow":
          const endX = element.x + element.points[1][0];
          const endY = element.y + element.points[1][1];
          dslElement = ["a", element.x, element.y, endX, endY];
          break;

        case "line":
          dslElement = ["l", element.x, element.y, element.points];
          break;

        case "freedraw":
          dslElement = ["f", element.x, element.y, element.points];
          break;

        case "text":
          dslElement = ["t", element.x, element.y, element.text];
          if (element.fontSize !== DSL_SCHEMA.DEFAULTS.fontSize) {
            dslElement.push(element.fontSize);
          }
          break;

        default:
          console.warn(`Unknown element type: ${element.type}`);
          return;
      }

      // Add non-default properties
      this.addNonDefaultProps(dslElement, element);
      dslElements.push(dslElement);
    });

    return dslElements;
  }

  // Add non-default properties to DSL element
  static addNonDefaultProps(dslElement, element) {
    const type = dslElement[0];
    const defaults = DSL_SCHEMA.DEFAULTS;

    // Add stroke color if different from default
    if (element.strokeColor !== defaults.strokeColor) {
      dslElement.push(["s", element.strokeColor]);
    }

    // Add fill color if different from default
    if (element.backgroundColor !== defaults.backgroundColor) {
      dslElement.push(["f", element.backgroundColor]);
    }

    // Add stroke width if different from default
    if (element.strokeWidth !== defaults.strokeWidth) {
      dslElement.push(["w", element.strokeWidth]);
    }

    // Add roundness if not null
    if (element.roundness && element.roundness.type) {
      dslElement.push(["r", element.roundness.type]);
    }
  }

  // DSL → EXCALIDRAW CONVERSION
  static fromDSL(dslElements) {
    const excalidrawElements = [];

    dslElements.forEach((dslElement, index) => {
      const element = this.createExcalidrawElement(dslElement, index);
      if (element) {
        excalidrawElements.push(element);
      }
    });

    return excalidrawElements;
  }

  // Create Excalidraw element from DSL
  static createExcalidrawElement(dslElement, index) {
    const [type, x, y, ...props] = dslElement;
    const elementType = DSL_SCHEMA.TYPES[type];

    if (!elementType) {
      console.warn(`Unknown DSL type: ${type}`);
      return null;
    }

    // Base element structure
    const element = {
      id: this.generateId(),
      type: elementType,
      x: x,
      y: y,
      angle: 0,
      strokeColor: DSL_SCHEMA.DEFAULTS.strokeColor,
      backgroundColor: DSL_SCHEMA.DEFAULTS.backgroundColor,
      fillStyle: DSL_SCHEMA.DEFAULTS.fillStyle,
      strokeWidth: DSL_SCHEMA.DEFAULTS.strokeWidth,
      strokeStyle: DSL_SCHEMA.DEFAULTS.strokeStyle,
      roughness: DSL_SCHEMA.DEFAULTS.roughness,
      opacity: DSL_SCHEMA.DEFAULTS.opacity,
      groupIds: [],
      frameId: null,
      index: `a${index}`,
      roundness: DSL_SCHEMA.DEFAULTS.roundness,
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
    this.addTypeSpecificProps(element, elementType, props);

    // Process additional properties (non-default values)
    this.processAdditionalProps(element, props);

    return element;
  }

  // Add type-specific properties
  static addTypeSpecificProps(element, elementType, props) {
    switch (elementType) {
      case "rectangle":
      case "ellipse":
      case "diamond":
        element.width = props[0] || 100;
        element.height = props[1] || 100;
        if (elementType === "rectangle") {
          element.roundness = { type: 3 };
        } else if (elementType === "ellipse") {
          element.roundness = { type: 2 };
        } else {
          element.roundness = { type: 2 };
        }
        break;

      case "arrow":
        const endX = props[0] || element.x + 100;
        const endY = props[1] || element.y;
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
      case "freedraw":
        element.points = props[0] || [
          [0, 0],
          [100, 0],
        ];
        if (elementType === "line") {
          element.roundness = { type: 2 };
          element.startBinding = null;
          element.endBinding = null;
          element.startArrowhead = null;
          element.endArrowhead = null;
          element.lastCommittedPoint = null;
        } else {
          element.roundness = null;
          element.pressures = [];
          element.simulatePressure = true;
          element.lastCommittedPoint = element.points[
            element.points.length - 1
          ] || [0, 0];
        }
        // Calculate bounds
        const bounds = this.calculateBounds(element.points);
        element.width = bounds.width;
        element.height = bounds.height;
        break;

      case "text":
        element.text = props[0] || "Text";
        element.fontSize = props[1] || DSL_SCHEMA.DEFAULTS.fontSize;
        element.fontFamily = DSL_SCHEMA.DEFAULTS.fontFamily;
        element.textAlign = DSL_SCHEMA.DEFAULTS.textAlign;
        element.verticalAlign = DSL_SCHEMA.DEFAULTS.verticalAlign;
        element.containerId = null;
        element.originalText = element.text;
        element.autoResize = true;
        element.lineHeight = 1.25;
        // Rough text size calculation
        element.width = element.text.length * element.fontSize * 0.6;
        element.height = element.fontSize * 1.25;
        break;
    }
  }

  // Process additional properties (color overrides, etc.)
  static processAdditionalProps(element, props) {
    props.forEach((prop) => {
      if (Array.isArray(prop)) {
        const [key, value] = prop;
        switch (key) {
          case "s": // stroke color
            element.strokeColor = value;
            break;
          case "f": // fill color
            element.backgroundColor = value;
            break;
          case "w": // stroke width
            element.strokeWidth = value;
            break;
          case "r": // roundness
            element.roundness = { type: value };
            break;
        }
      }
    });
  }

  // Calculate bounds for line/freedraw elements
  static calculateBounds(points) {
    if (!points || points.length === 0) return { width: 0, height: 0 };

    let minX = points[0][0],
      maxX = points[0][0];
    let minY = points[0][1],
      maxY = points[0][1];

    points.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    return {
      width: Math.abs(maxX - minX),
      height: Math.abs(maxY - minY),
    };
  }
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

// Example DSL representations
const EXAMPLE_DSL = {
  // Ultra-compact shapes
  simpleShapes: [
    ["r", 100, 100, 200, 150], // Rectangle at (100,100), 200x150
    ["e", 400, 200, 150, 150], // Circle at (400,200), 150x150
    ["d", 200, 300, 100, 100], // Diamond at (200,300), 100x100
  ],

  // Shapes with custom colors
  coloredShapes: [
    ["r", 50, 50, 100, 100, ["s", "r"], ["f", "y"]], // Red stroke, yellow fill
    ["e", 200, 50, 80, 80, ["s", "b"]], // Blue stroke
  ],

  // Lines and arrows
  connections: [
    ["a", 100, 200, 300, 250], // Arrow from (100,200) to (300,250)
    [
      "l",
      50,
      300,
      [
        [0, 0],
        [100, 50],
        [150, 0],
      ],
    ], // Multi-segment line
  ],

  // Text elements
  text: [
    ["t", 100, 400, "Hello World"], // Text at (100,400)
    ["t", 200, 450, "Big Text", 32], // Larger text
  ],

  // Complex drawing (50+ elements in minimal tokens)
  grid: Array.from({ length: 10 }, (_, i) =>
    Array.from({ length: 5 }, (_, j) => ["r", i * 60 + 10, j * 40 + 10, 50, 30])
  ).flat(),
};

// Test the converter
console.log("=== DSL to Excalidraw Test ===");
const testDSL = [
  ["r", 100, 100, 200, 150],
  ["e", 400, 200, 150, 150, ["s", "#e03131"]],
  ["a", 300, 150, 400, 200],
  ["t", 150, 300, "Sample Text"],
];

// const excalidrawElements = ExcalidrawDSLConverter.fromDSL(testDSL);
// console.log("Generated Excalidraw elements:", excalidrawElements);

// const backToDSL = ExcalidrawDSLConverter.toDSL(excalidrawElements);
// console.log("Converted back to DSL:", backToDSL);

// =============================================================================
// DSL GENERATION PROMPT
// =============================================================================

const DSL_GENERATION_PROMPT = `
You are an Excalidraw DSL generator. Convert user descriptions into ultra-compact DSL format.

DSL FORMAT REFERENCE:
- Rectangle: ['r', x, y, width, height, ...props]
- Circle/Ellipse: ['e', x, y, width, height, ...props]  
- Diamond: ['d', x, y, width, height, ...props]
- Arrow: ['a', startX, startY, endX, endY, ...props]
- Line: ['l', startX, startY, [[x1,y1], [x2,y2], ...], ...props]
- Freedraw: ['f', startX, startY, [[x1,y1], [x2,y2], ...], ...props]
- Text: ['t', x, y, 'text content', fontSize?, ...props]

OPTIONAL PROPERTIES:
- ['s', color] = stroke color ('k'=black, 'r'=red, 'g'=green, 'b'=blue, 'w'=white)
- ['f', color] = fill color  
- ['w', number] = stroke width
- ['r', number] = roundness type

GENERATION RULES:
1. Use minimal coordinates and sizes
2. Omit default properties  
3. Use color shortcuts when possible
4. For grids/patterns, use loops or arrays
5. Position elements to avoid overlap
6. Keep total token count under 500 for 50+ elements

EXAMPLES:
User: "Draw a simple house"
Output: [
  ['r', 100, 200, 200, 150],           // House base
  ['l', 100, 200, [[0,0], [100,-50], [200,0]]], // Roof
  ['r', 150, 250, 50, 80],             // Door
  ['r', 120, 220, 30, 30],             // Window 1
  ['r', 250, 220, 30, 30]              // Window 2
]

User: "Create a flowchart with 3 boxes connected by arrows"
Output: [
  ['r', 50, 100, 100, 50],             // Box 1
  ['r', 200, 100, 100, 50],            // Box 2  
  ['r', 350, 100, 100, 50],            // Box 3
  ['a', 150, 125, 200, 125],           // Arrow 1->2
  ['a', 300, 125, 350, 125],           // Arrow 2->3
  ['t', 85, 120, 'Start'],             // Text 1
  ['t', 225, 120, 'Process'],          // Text 2
  ['t', 385, 120, 'End']               // Text 3
]

Now generate DSL for user input, optimizing for minimal tokens while maintaining clarity.
`;
export default ExcalidrawDSLConverter;

// Export the converter and utilities
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ExcalidrawDSLConverter,
    DSL_SCHEMA,
    EXAMPLE_DSL,
    DSL_GENERATION_PROMPT,
  };
}
