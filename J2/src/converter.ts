// Convert Excalidraw JSON -> J2
export function excalidrawToJ2(excalidrawJson: any) {
  return excalidrawJson.elements.map((el: any) => {
    switch (el.type) {
      case "rectangle":
        return {
          id: el.id,
          type: "rect",
          pos: [el.x, el.y],
          size: [el.width, el.height],
          style: { stroke: el.strokeColor, fill: el.backgroundColor },
        };
      case "text":
        return {
          id: el.id,
          type: "text",
          pos: [el.x, el.y],
          text: el.text,
          font: { size: el.fontSize, family: el.fontFamily },
          style: { fill: el.strokeColor },
        };
      default:
        return { id: el.id, type: el.type };
    }
  });
}

// Convert J2 -> Excalidraw JSON
export function j2ToExcalidraw(j2: any) {
  return {
    type: "excalidraw",
    version: 2,
    source: "j2-engine",
    elements: j2.map((el: any) => {
      if (el.type === "rect") {
        return {
          id: el.id,
          type: "rectangle",
          x: el.pos[0],
          y: el.pos[1],
          width: el.size?.[0] ?? 100,
          height: el.size?.[1] ?? 100,
          strokeColor: el.style?.stroke ?? "#000",
          backgroundColor: el.style?.fill ?? "transparent",
        };
      } else if (el.type === "text") {
        return {
          id: el.id,
          type: "text",
          x: el.pos[0],
          y: el.pos[1],
          text: el.text ?? "",
          fontSize: el.font?.size ?? 16,
          fontFamily: el.font?.family ?? "Arial",
          strokeColor: el.style?.fill ?? "#000",
        };
      }
      return el;
    }),
  };
}
