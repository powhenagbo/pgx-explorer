import React, { useEffect, useRef } from "react";
import SmilesDrawer from "smiles-drawer";

export default function MoleculeViewer({ smiles }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!smiles) {
      ctx.font = "16px Arial";
      ctx.fillText("No molecule selected", 20, 40);
      return;
    }

    const drawer = new SmilesDrawer.Drawer({
      width: 500,
      height: 300
    });

    SmilesDrawer.parse(smiles, tree => {
      drawer.draw(tree, canvas, "light", false);
    });
  }, [smiles]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={300}
      style={{ border: "1px solid #ccc", background: "#fff" }}
    />
  );
}