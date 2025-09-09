import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ExcalidrawState {
  elements: any[]; // treat elements as raw JSON
}

const initialState: ExcalidrawState = {
  elements: [],
};

const currentExcalidrawSlice = createSlice({
  name: "currentExcalidraw",
  initialState,
  reducers: {
    setElements: (state, action: PayloadAction<any[]>) => {
      state.elements = action.payload; // replace full JSON
    },
    clearElements: (state) => {
      state.elements = [];
    },
  },
});

export const { setElements, clearElements } =
  currentExcalidrawSlice.actions;

export default currentExcalidrawSlice.reducer;
