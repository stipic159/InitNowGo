export interface LogConfig {
  output: string;
  error: string;
  log: string;
}

export interface ApiConfig extends LogConfig {
  name: string;
  script: string;
}
