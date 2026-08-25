/**
 * Cobertura del seguro de depósitos de Fogafín.
 *
 * El monto se fijó en $50.000.000 por depositante, por entidad financiera
 * inscrita, mediante la Resolución 002 de 2017 de la Junta Directiva de
 * Fogafín (subió de $20.000.000, vigente desde abril de 2017). Esa misma
 * resolución adoptó una política de revisión cada 3 años basada en
 * inflación -- no se encontró evidencia de que el monto haya cambiado desde
 * entonces (verificado con fuentes fechadas hasta junio de 2026), pero como
 * la política de revisión existe, vale la pena confirmar el monto vigente
 * antes de tomar una decisión importante.
 *
 * La cobertura es por depositante y por entidad, sin importar cuántos
 * productos tenga ahí (CDTs, cuenta de ahorros, cuenta corriente, etc. se
 * suman entre sí) -- pero es independiente entre entidades distintas.
 */
export const COBERTURA_MAXIMA_FOGAFIN = 50000000;

export const FUENTE_FOGAFIN =
  'Resolución 002 de 2017 de la Junta Directiva de Fogafín (vigente desde abril de 2017, con revisión prevista ' +
  'cada 3 años basada en inflación -- sin cambios de monto confirmados hasta junio de 2026).';
