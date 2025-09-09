import { configureStore } from "@reduxjs/toolkit";
import currentExcalidrawReducer from "@/lib/slice/currentExcalidrawSlice"
export const store = configureStore({
  reducer: {
    currentExcalidraw: currentExcalidrawReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
