import { useEffect } from "react";

export default function useUnloadWarning(shouldWarn) {
  useEffect(() => {
    if (!shouldWarn) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; 
      // required for Chrome
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldWarn]);
}
