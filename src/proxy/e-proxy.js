export default {
  async fetch(request) {
    // Reuse the proxy code from earlier
    const { searchParams } = new URL(request.url);
    const originZip = searchParams.get('origin');
    const destZip = searchParams.get('dest');

    if (!originZip || !destZip) {
      return new Response('Missing ZIP codes', { status: 400 });
    }

    const estafetaUrl = `https://frecuenciaentregasitecorecms.azurewebsites.net/?originZipCode=${originZip}&destinationZipCode=${destZip}&country=MEX&language=0`;
    const response = await fetch(estafetaUrl);
    const html = await response.text();

    const costMatch = html.match(/<h5[^>]*>Costos de Reexpedición<\/h5>\s*<div[^>]*>([^<]+)<\/div>/i);
    const cost = costMatch ? costMatch[1].trim() : 'No disponible';

    return new Response(JSON.stringify({ cost }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};