import React, { useState } from "react";
import "./App.css";

function App() {
  const questions = [
    "Nombre de cafecultor",
    "Fecha",
    "Promedio de por lo menos tres abrobles de cafè",
    "Quantas plantas de cafè?",
    "Nombre de la comunidad",
    "Ubicación",
  ];

  const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [coordinates, setCoordinates] = useState({ latitude: "", longitude: "" });
  const [locked, setLocked] = useState(Array(questions.length).fill(false));
  const [trees, setTrees] = useState([{ species: "", diameter: "" }]);
  const [treesLocked, setTreesLocked] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleSave = (index) => {
    if (locked[index]) {
      setLocked((prev) => {
        const newLocked = [...prev];
        newLocked[index] = false;
        return newLocked;
      });
      if (index === questions.length - 1) {
        localStorage.removeItem("latitude");
        localStorage.removeItem("longitude");
      } else {
        localStorage.removeItem(`q${index}`);
      }
      setAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[index] = "";
        return newAnswers;
      });
    } else {
      setLocked((prev) => {
        const newLocked = [...prev];
        newLocked[index] = true;
        return newLocked;
      });
      if (index === questions.length - 1) {
        localStorage.setItem("latitude", coordinates.latitude);
        localStorage.setItem("longitude", coordinates.longitude);
        showToast("Guardado: coordenadas");
      } else {
        localStorage.setItem(`q${index}`, answers[index]);
        showToast(`Guardado: ${questions[index]}`);
      }
      setShowSubmit(true);
    }
  };

  const handleSaveTrees = () => {
    if (treesLocked) {
      setTreesLocked(false);
      localStorage.removeItem("trees");
      setTrees([{ species: "", diameter: "" }]);
    } else {
      setTreesLocked(true);
      localStorage.setItem("trees", JSON.stringify(trees));
      showToast("Guardado: lista de árboles");
      setShowSubmit(true);
    }
  };

  const handleTreeChange = (index, field, value) => {
    const newTrees = [...trees];
    newTrees[index][field] = value;
    setTrees(newTrees);
  };

  const addTree = () => setTrees([...trees, { species: "", diameter: "" }]);
  const removeTree = (index) => setTrees(trees.filter((_, i) => i !== index));
  const handleChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleCoordinateChange = (field, value) => {
    setCoordinates((prev) => ({ ...prev, [field]: value }));
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("La geolocalización no es compatible con su navegador");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
        setError(null);
      },
      (err) => setError(`Error obteniendo ubicación: ${err.message}`)
    );
  };

  const handleSubmit = async () => {
    let sheetData = [];
    const savedTrees = JSON.parse(localStorage.getItem("trees") || "[]");
    const numRows = Math.max(1, savedTrees.length);

    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let q = 0; q < questions.length; q++) {
        if (q === questions.length - 1) {
          row.push(localStorage.getItem("latitude") || "");
          row.push(localStorage.getItem("longitude") || "");
        } else {
          row.push(localStorage.getItem(`q${q}`) || "");
        }
      }
      if (savedTrees[i]) {
        row.push(savedTrees[i].species, savedTrees[i].diameter);
      } else {
        row.push("", "");
      }
      sheetData.push(row);
    }

    try {
      await fetch("https://script.google.com/macros/s/AKfycbwc-SJZiO7hIW7aS9fX_rnhAYLsqjjKbI1D71b3S-WCrkbrwBsF4UcxHPotJa-cVgi3/exec", {
        redirect: "follow",
        method: "POST",
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
      });
      localStorage.clear();
      setAnswers(Array(questions.length).fill(""));
      setCoordinates({ latitude: "", longitude: "" });
      setTrees([{ species: "", diameter: "" }]);
      setLocked(Array(questions.length).fill(false));
      setTreesLocked(false);
      setShowSubmit(false);
      setShowConfirm(false);
      showToast("¡Enviado con éxito!");
    } catch (err) {
      console.error("Error al enviar:", err);
      showToast("Error al enviar los datos.");
    }
  };

  const handleSubmitClick = () => {
    const unansweredCount = locked.filter((l) => !l).length + (treesLocked ? 0 : 1);
    if (unansweredCount > 0) {
      setShowConfirm(true);
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="App">
      {questions.map((question, index) => (
        <div
          className="question-card"
          key={index}
          style={{ backgroundColor: locked[index] ? "#e0e0e0" : "white" }}
        >
          <div className="question-header">{question}</div>

          {index === questions.length - 1 ? (
            <>
              <div className="coordinate-inputs">
                <div className="coordinate-field">
                  <label>Latitud</label>
                  <input
                    type="text"
                    placeholder="Ingrese latitud..."
                    value={coordinates.latitude}
                    onChange={(e) => handleCoordinateChange("latitude", e.target.value)}
                    disabled={locked[index]}
                  />
                </div>
                <div className="coordinate-field">
                  <label>Longitud</label>
                  <input
                    type="text"
                    placeholder="Ingrese longitud..."
                    value={coordinates.longitude}
                    onChange={(e) => handleCoordinateChange("longitude", e.target.value)}
                    disabled={locked[index]}
                  />
                </div>
              </div>
              {!locked[index] && (
                <button className="location-button" onClick={handleUseLocation}>
                  📍 Usar mi ubicación
                </button>
              )}
              {error && <p style={{ color: "red" }}>{error}</p>}
            </>
          ) : (
            <textarea
              className="response-input"
              placeholder="Escribir su respuesta..."
              value={answers[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              disabled={locked[index]}
            ></textarea>
          )}

          <div style={{ marginTop: "12px", textAlign: "right" }}>
            <button className="submit-button" onClick={() => handleSave(index)}>
              {locked[index] ? "Editar" : "Guardar"}
            </button>
          </div>
        </div>
      ))}

      <div
        className="question-card"
        style={{ backgroundColor: treesLocked ? "#e0e0e0" : "white" }}
      >
        <div className="question-header">Especies de arbole de sombra y su diámetro</div>

        {trees.map((tree, index) => (
          <div key={index} className="tree-entry">
            <input
              type="text"
              placeholder="Especie de árbol"
              value={tree.species}
              onChange={(e) => handleTreeChange(index, "species", e.target.value)}
              disabled={treesLocked}
            />
            <input
              type="number"
              placeholder="Diámetro"
              value={tree.diameter}
              onChange={(e) => handleTreeChange(index, "diameter", e.target.value)}
              disabled={treesLocked}
            />
            {!treesLocked && trees.length > 1 && (
              <button onClick={() => removeTree(index)} className="remove-tree-button">
                Eliminar
              </button>
            )}
          </div>
        ))}

        {!treesLocked && (
          <button onClick={addTree} className="add-tree-button">
            + Agregar un árbol
          </button>
        )}

        <div style={{ marginTop: "12px", textAlign: "right" }}>
          <button className="submit-button" onClick={handleSaveTrees}>
            {treesLocked ? "Editar árboles" : "Guardar árboles"}
          </button>
        </div>
      </div>

      {/* Final Submit Button or Confirmation Modal */}
      {showSubmit && !showConfirm && (
        <button className="final-submit-button" onClick={handleSubmitClick}>
          Enviar
        </button>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>¿Estás seguro?</h2>
            <p>Algunas preguntas no han sido respondidas.</p>
            <div className="modal-actions">
              <button className="submit-btn" onClick={handleSubmit}>
                Enviar
              </button>
              <button className="cancel-btn" onClick={() => setShowConfirm(false)}>
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
