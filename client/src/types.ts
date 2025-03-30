export enum ModelType {
  BASIC = "basic",
  ADVANCED = "advanced",
}

export interface AnalyseEvent extends MessageEvent {
  type: "ANALYSE";
  payload: {
    post_content: string;
  };
}
export interface UserFeedbackEvent extends MessageEvent {
  type: "DISAGREE";
  payload: DetectionReport;
}

export interface NavigateEvent extends MessageEvent {
  type: "NAVIGATE_EVENT";
  pathname: string;
}
export interface ToggleScanningEvent extends MessageEvent {
  type: "TOGGLE_SCANNING";
  isScanning: boolean;
}

export interface ShapValue {
  value: number;
  word: string;
}

export interface DetectionReport {
  prediction: DetectionResult;
  confidence: number;
  raw_confidence_score: number;
  cleaned_text: string;
  word_scores: ShapValue[] | null;
}

export enum DetectionResult {
  General,
  MLM,
}
