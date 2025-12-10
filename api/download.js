// api/download.js
export default async function handler(req) {
  // Hanya izinkan method GET
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
    // ✅ Forward ke ryzumi.vip dari server (aman, tanpa CORS)
    const ryzumiUrl = `https://api.ryzumi.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`;
    
    const res = await fetch(ryzumiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TikTokDownloader/1.0)',
        'Accept': 'application/json'
      },
      redirect: 'follow',
      // Optional: tambahkan timeout jika perlu
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success || data.data?.code !== 0) {
      throw new Error(data.data?.msg || 'Gagal memproses video');
    }

    const video = data.data.data;

    // ✅ Hanya return data yang diperlukan (minimal & aman)
    return new Response(JSON.stringify({
      success: true,
      id: video.id,
      title: video.title,
      author: {
        unique_id: video.author.unique_id,
        nickname: video.author.nickname,
        avatar: video.author.avatar
      },
      play: video.play,          // no watermark
      wmplay: video.wmplay,      // with watermark
      hdplay: video.hdplay,      // HD no WM
      music: video.music         // audio
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // cache 5 menit
        // ✅ Lindungi dari abuse: batasi akses
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Vary': 'Origin'
      }
    });

  } catch (err) {
    console.error('[API Error]', err.message);
    return new Response(JSON.stringify({
      success: false,
      message: 'Gagal mengambil video. Coba lagi nanti.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
