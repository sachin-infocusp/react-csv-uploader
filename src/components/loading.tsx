import React from "react";

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <SmallSpinner />
    </div>
  );
}
export function SmallSpinner() {
  return (
    <div className="border-t-4 border-green-400 border-solid rounded-full w-16 h-16 animate-spin"></div>
  );
}
