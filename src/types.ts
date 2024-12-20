export interface NavigateEvent extends MessageEvent {
  type: "NAVIGATE_EVENT";
  pathname: string;
}
