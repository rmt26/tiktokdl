// api/download.js — Versi diperbaiki
export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ success: false, message: 'URL diperlukan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // ✅ Gunakan fetch dengan timeout dan header yang lebih realistis
    const ryzumiUrl = `https://api.ryzumi.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`;
    
    const res = await fetch(ryzumiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000) // Timeout 8 detik
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    // ✅ Ambil teks dulu, baru parse JSON
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('[JSON Parse Error]', parseErr.message, 'Raw response:', text);
      throw new Error('API tidak mengembalikan data JSON yang valid.');
    }

    // ✅ Validasi struktur data
    if (!data.success || !data.data?.code === 0) {
      throw new Error(data.data?.msg || 'Gagal memproses video');
    }

    const video = data.data.data;

    // ✅ Hanya kirim field penting
    return new Response(JSON.stringify({
      success: true,
      id: video.id,
      title: video.title,
      author: {
        unique_id: video.author.unique_id,
        nickname: video.author.nickname,
        avatar: video.author.avatar
      },
      play: video.play,
      wmplay: video.wmplay,
      hdplay: video.hdplay,
      music: video.music
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Vary': 'Origin'
      }
    });

  } catch (err) {
    console.error('[API ERROR]', err.message); // Log ke server Vercel
    return new Response(JSON.stringify({
      success: false,
      message: 'Gagal memproses video. Coba lagi nanti atau gunakan URL lain.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
