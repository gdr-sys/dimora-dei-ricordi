// functions/foto-cdn/[nome].js
// Serve le foto direttamente da R2

export async function onRequest(context) {
  const { params, env } = context;
  const nome = params.nome;

  const object = await env.FOTO_BUCKET.get(nome);
  if (!object) {
    return new Response('Foto non trovata', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
}
