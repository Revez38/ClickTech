export function validarAmbiente(config: Record<string, unknown>) {
  const uri = String(config.MONGODB_URI ?? '').trim();
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri) || /<[^>]+>/.test(uri)) {
    throw new Error(
      'Configure MONGODB_URI no arquivo .env com a conexão do seu MongoDB Atlas.',
    );
  }
  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
  }
  return { ...config, MONGODB_URI: uri, PORT: port };
}
