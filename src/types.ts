export interface NavigateEvent extends MessageEvent {
  type: "NAVIGATE_EVENT";
  pathname: string;
}
export interface ToggleScanningEvent extends MessageEvent {
  type: "TOGGLE_SCANNING";
  isScanning: boolean;
}

export interface DetectionReport {
  prediction: DetectionResult;
}

export enum DetectionResult {
  MLM = "mlm",
  General = "general",
}
