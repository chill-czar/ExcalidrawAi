import  ExcalidrawDSLConverter  from "./src/converter.js";
import clipboard from "clipboardy"; // ✅ Node-compatible clipboard

const dslElement = [
  // Head
  ["e", 200, 200, 80, 80, ["s", "k"]], // Face

  // Ears (triangles via freedraw)
  [
    "f",
    180,
    160,
    [
      [0, 0],
      [20, -30],
      [40, 0],
    ],
    ["s", "k"],
  ], // Left ear
  [
    "f",
    240,
    160,
    [
      [0, 0],
      [20, -30],
      [40, 0],
    ],
    ["s", "k"],
  ], // Right ear

  // Eyes
  ["e", 190, 200, 10, 15, ["s", "k"], ["f", "w"]], // Left eye
  ["e", 230, 200, 10, 15, ["s", "k"], ["f", "w"]], // Right eye
  ["t", 188, 198, ".", 12], // Left pupil
  ["t", 228, 198, ".", 12], // Right pupil

  // Nose (small triangle)
  [
    "f",
    210,
    215,
    [
      [0, 0],
      [5, 5],
      [10, 0],
    ],
    ["s", "k"],
  ],

  // Mouth (small curve lines)
  [
    "l",
    210,
    225,
    [
      [0, 0],
      [10, 5],
    ],
  ], // Right mouth
  [
    "l",
    210,
    225,
    [
      [0, 0],
      [-10, 5],
    ],
  ], // Left mouth

  // Whiskers
  [
    "l",
    180,
    215,
    [
      [0, 0],
      [-25, 0],
    ],
  ], // Left whisker 1
  [
    "l",
    180,
    220,
    [
      [0, 0],
      [-25, 5],
    ],
  ], // Left whisker 2
  [
    "l",
    180,
    210,
    [
      [0, 0],
      [-25, -5],
    ],
  ], // Left whisker 3
  [
    "l",
    240,
    215,
    [
      [0, 0],
      [25, 0],
    ],
  ], // Right whisker 1
  [
    "l",
    240,
    220,
    [
      [0, 0],
      [25, 5],
    ],
  ], // Right whisker 2
  [
    "l",
    240,
    210,
    [
      [0, 0],
      [25, -5],
    ],
  ], // Right whisker 3

  // Body
  ["e", 200, 300, 100, 120, ["s", "k"]], // Oval body

  // Paws
  ["e", 170, 380, 20, 20, ["s", "k"]], // Left paw
  ["e", 230, 380, 20, 20, ["s", "k"]], // Right paw

  // Tail (curved freedraw)
  [
    "f",
    250,
    320,
    [
      [0, 0],
      [40, -20],
      [60, 20],
      [30, 40],
    ],
    ["s", "k"],
  ],

  // Text
  ["t", 190, 430, "Cat", 16],
];
;

const excalidrawElements = ExcalidrawDSLConverter.fromDSL(dslElement);

// Copy JSON string to clipboard
clipboard.writeSync(JSON.stringify(excalidrawElements, null, 2));

console.log("✅ Excalidraw elements copied to clipboard!");
