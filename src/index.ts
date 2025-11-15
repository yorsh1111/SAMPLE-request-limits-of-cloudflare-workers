import { Hono } from 'hono'
import { R2Bucket } from '@cloudflare/workers-types'

interface Bindings {
  test_bucket_20251115: R2Bucket;
}

const app = new Hono<{ Bindings: Bindings }>();

/**
 * ファイルアップロードAPI - バイナリデータ受信
 * POST /upload
 * 
 * リクエストヘッダー:
 * - Content-Type: アップロードするファイルのMIMEタイプ
 */
app.post('/upload', async (c) => {
  try {
    // リクエストボディからバイナリデータを直接取得
    const arrayBuffer = await c.req.arrayBuffer();
    
    // バリデーション
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return c.json(
        {
          error: 'BadRequest',
          message: 'ファイルデータが必要です',
        },
        400
      );
    }

    // Content-Typeの取得（リクエストヘッダーから）
    const contentType = c.req.header('Content-Type') || 'application/octet-stream';
    
    // ファイル名を生成（文字列型に変換）
    const r2Key = Date.now().toString();
    
    // R2にファイルをアップロード
    const r2 = c.env.test_bucket_20251115;

    await r2.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: contentType,
      },
    });

    return c.json({
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return c.json(
      {
        error: 'InternalServerError',
        message: `ファイルのアップロードに失敗しました: ${errorMessage}`,
      },
      500
    );
  }
});

export default app;
