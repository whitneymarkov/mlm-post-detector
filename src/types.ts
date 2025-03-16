export interface NavigateEvent extends MessageEvent {
  type: "NAVIGATE_EVENT";
  pathname: string;
}
export interface ToggleScanningEvent extends MessageEvent {
  type: "TOGGLE_SCANNING";
  isScanning: boolean;
}
