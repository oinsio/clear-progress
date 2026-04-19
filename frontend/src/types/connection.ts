export type BackendType = "gas";

export type GasConnectionConfig = {
  type: "gas";
  url: string;
  clientId?: string;
};

export type ConnectionConfig = GasConnectionConfig;
