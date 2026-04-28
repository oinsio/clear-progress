export interface PingResponse {
  ok: boolean;
  app: string;
  version: string;
  initialized: boolean;
}

export interface InitResponse {
  ok: boolean;
}
