import { DetectionReport } from "../types";

export type AnalysisResult = DetectionReport & { reported: boolean };

// Global map to store analysis results keyed by shortcode
export const analysisResults = new Map<string, AnalysisResult>();
