export type BackendType = "gas";

export type GasConnectionConfig = {
  type: "gas";
  url: string;
  clientId?: string;
  isActive: boolean;
};

export type ConnectionConfig = GasConnectionConfig;
