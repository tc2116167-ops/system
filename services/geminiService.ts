
import { GoogleGenAI } from "@google/genai";
import { Producto, Movimiento } from "../types";

export const getSmartSummary = async (productos: Producto[], movimientos: Movimiento[]) => {
  // Fix: Initializing GoogleGenAI with named parameter as per the latest library guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Como consultor experto en retail textil para una empresa peruana con 3 dueños.
    Analiza los siguientes datos de inventario y ventas:
    
    PRODUCTOS: ${JSON.stringify(productos)}
    MOVIMIENTOS RECIENTES: ${JSON.stringify(movimientos.slice(0, 20))}
    
    Genera un informe ejecutivo corto (máximo 250 palabras) en español que incluya:
    1. Resumen de salud del stock (¿Qué falta? ¿Qué sobra?).
    2. Tendencias de ventas (Lima vs Provincia).
    3. Una recomendación estratégica para los 3 dueños.
    4. Alerta de colores o tallas que se están agotando rápidamente.
    
    Usa un tono profesional pero directo. No uses Markdown complejo, solo párrafos claros.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Accessing .text property directly instead of calling it as a method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "No se pudo generar el análisis inteligente en este momento.";
  }
};
