import React, { useState, useEffect } from 'react';
import { Upload, Home, Sofa, Sparkles, Loader2, Download, RefreshCw, AlertCircle } from 'lucide-react';

// Configuración de Firebase y API (Variables proporcionadas por el entorno)
const apiKey = "";
const MODEL_NAME = "gemini-2.5-flash-image-preview";

export default function App() {
  const [roomFile, setRoomFile] = useState(null);
  const [roomPreview, setRoomPreview] = useState(null);
  const [furnitureFile, setFurnitureFile] = useState(null);
  const [furniturePreview, setFurniturePreview] = useState(null);
  const [prompt, setPrompt] = useState("Coloca esta estantería al fondo a la derecha del salón, integrándola perfectamente con la iluminación y sombras de la habitación.");
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState(null);

  // Convertir archivo a base64 para la API
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (type === 'room') {
        setRoomFile(file);
        setRoomPreview(previewUrl);
      } else {
        setFurnitureFile(file);
        setFurniturePreview(previewUrl);
      }
    }
  };

  const generateDesign = async () => {
    if (!roomFile || !furnitureFile || !prompt) {
      setError("Por favor, sube ambas fotos y escribe un prompt.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const roomBase64 = await fileToBase64(roomFile);
      const furnitureBase64 = await fileToBase64(furnitureFile);

      const payload = {
        contents: [
          {
            parts: [
              { text: `Tarea: Integración de muebles en interiores.
                Imagen 1: Habitación vacía.
                Imagen 2: Mueble a insertar.
                Instrucción: ${prompt}.
                Asegúrate de que la perspectiva, el tamaño y las sombras del mueble coincidan con el entorno de la habitación.`
              },
              { inlineData: { mimeType: roomFile.type, data: roomBase64 } },
              { inlineData: { mimeType: furnitureFile.type, data: furnitureBase64 } }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      };

      const executeCall = async (retryCount = 0) => {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }
          );

          if (!response.ok) throw new Error(`Error API: ${response.status}`);

          const data = await response.json();
          const base64Data = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

          if (base64Data) {
            setResultImage(`data:image/png;base64,${base64Data}`);
          } else {
            throw new Error("No se pudo generar la imagen. Intenta con un prompt más descriptivo.");
          }
        } catch (err) {
          if (retryCount < 5) {
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return executeCall(retryCount + 1);
          }
          throw err;
        }
      };

      await executeCall();

    } catch (err) {
      console.error(err);
      setError("Hubo un problema al conectar con la IA. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-full mb-4">
            <Home className="w-6 h-6 text-indigo-600 mr-2" />
            <span className="text-indigo-600 font-bold uppercase tracking-wider text-xs">AI Interior Designer</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Decora con IA</h1>
          <p className="text-slate-600">Sube tu habitación y el mueble que te gusta. La IA hará el resto.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Control */}
          <div className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center">
                <Home className="w-4 h-4 mr-2" /> 1. Habitación Vacía
              </label>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-4 transition-colors text-center ${roomPreview ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
              >
                {roomPreview ? (
                  <img src={roomPreview} className="max-h-48 mx-auto rounded-lg shadow-sm" alt="Preview Room" />
                ) : (
                  <div className="py-8">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Haz clic para subir foto del salón/habitación</p>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload(e, 'room')}
                  accept="image/*"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center">
                <Sofa className="w-4 h-4 mr-2" /> 2. Mueble de Catálogo
              </label>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-4 transition-colors text-center ${furniturePreview ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
              >
                {furniturePreview ? (
                  <img src={furniturePreview} className="max-h-48 mx-auto rounded-lg shadow-sm" alt="Preview Furniture" />
                ) : (
                  <div className="py-8">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Haz clic para subir foto del mueble (Leroy Merlin, etc.)</p>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload(e, 'furniture')}
                  accept="image/*"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">3. Instrucciones para la IA</label>
              <textarea
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none"
                rows="3"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Pon la estantería en la pared lateral izquierda..."
              ></textarea>
            </div>

            <button
              onClick={generateDesign}
              disabled={loading || !roomFile || !furnitureFile}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center transition-all ${
                loading || !roomFile || !furnitureFile
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Mueblando habitación...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generar Diseño IA
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-start text-sm border border-red-100">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Panel de Resultados */}
          <div className="flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl min-h-[500px]">
            <div className="p-4 bg-slate-800 flex justify-between items-center">
              <span className="text-slate-300 text-xs font-bold uppercase tracking-widest flex items-center">
                <Sparkles className="w-3 h-3 mr-2 text-indigo-400" /> Vista Previa del Diseño
              </span>
              {resultImage && (
                <button
                  className="text-white bg-slate-700 p-2 rounded-lg hover:bg-slate-600 transition-colors"
                  onClick={() => window.open(resultImage)}
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
              {resultImage ? (
                <img
                  src={resultImage}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in fade-in zoom-in duration-700"
                  alt="Resultado"
                />
              ) : (
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <Home className="w-16 h-16 text-slate-700" />
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm max-w-[200px] mx-auto">
                    {loading ? "Calculando iluminación y sombras..." : "Sube tus fotos para ver el resultado aquí"}
                  </p>
                </div>
              )}
            </div>

            {resultImage && (
              <div className="p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
                <button
                  onClick={() => {
                    setResultImage(null);
                    generateDesign();
                  }}
                  className="w-full py-2 bg-slate-700 text-slate-200 rounded-xl text-sm hover:bg-slate-600 transition-all flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Intentar otra variación
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-xs">
          <p>Potenciado por Gemini 2.5 Flash Image Preview • Ideal para Real Estate y Home Staging</p>
        </footer>
      </div>
    </div>
  );
}
