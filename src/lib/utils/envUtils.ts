// src/lib/utils/envUtils.ts

export const getBooleanEnv = (envVar?: string, defaultValue: boolean = false): boolean => {
    if (envVar === undefined) return defaultValue;
    return envVar.toLowerCase() === 'true';
  };
  
  export const getNumberEnv = (defaultValue: number, envVar?: string): number => {
    if (envVar === undefined) return defaultValue;
    const num = parseInt(envVar, 10);
    return isNaN(num) ? defaultValue : num;
  };