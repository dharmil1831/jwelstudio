package com.jwelpixel.app;

import android.app.DownloadManager;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    attachGallerySaver();
  }

  @Override
  public void onResume() {
    super.onResume();
    attachGallerySaver();
  }

  private void attachGallerySaver() {
    if (getBridge() == null || getBridge().getWebView() == null) return;
    WebView webView = getBridge().getWebView();
    webView.addJavascriptInterface(new GallerySaver(), "JwelpixelDownload");
    webView.setDownloadListener(
        (url, userAgent, contentDisposition, mimetype, contentLength) -> {
          if (url == null || url.startsWith("blob:") || url.startsWith("data:")) return;
          try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null) request.addRequestHeader("Cookie", cookie);
            if (userAgent != null) request.addRequestHeader("User-Agent", userAgent);
            if (mimetype != null) request.setMimeType(mimetype);
            request.setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            String name = URLUtil.guessFileName(url, contentDisposition, mimetype);
            boolean image = mimetype != null && mimetype.startsWith("image/");
            boolean video = mimetype != null && mimetype.startsWith("video/");
            if (image) {
              request.setDestinationInExternalPublicDir(
                  Environment.DIRECTORY_PICTURES, "Jwelpixel/" + name);
            } else if (video) {
              request.setDestinationInExternalPublicDir(
                  Environment.DIRECTORY_MOVIES, "Jwelpixel/" + name);
            } else {
              request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
            }
            DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            if (manager != null) manager.enqueue(request);
          } catch (RuntimeException ignored) {
            // Keep the page open if the system download manager rejects the file.
          }
        });
  }

  private final class GallerySaver {
    @JavascriptInterface
    public boolean saveBase64(String data, String filename, String mime) {
      try {
        if (data == null || data.isEmpty()) return false;
        String payload = data;
        int comma = data.indexOf(',');
        if (data.startsWith("data:") && comma >= 0) payload = data.substring(comma + 1);
        byte[] bytes = Base64.decode(payload, Base64.DEFAULT);
        if (bytes.length == 0) return false;

        String type = mime == null || mime.isEmpty() ? "image/jpeg" : mime;
        boolean video = type.startsWith("video/");
        String safe = sanitize(filename, video ? "mp4" : type.contains("png") ? "png" : "jpg");

        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, safe);
        values.put(MediaStore.MediaColumns.MIME_TYPE, type);
        Uri collection;
        if (Build.VERSION.SDK_INT >= 29) {
          values.put(
              MediaStore.MediaColumns.RELATIVE_PATH,
              (video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES) + "/Jwelpixel");
          values.put(MediaStore.MediaColumns.IS_PENDING, 1);
          collection =
              video
                  ? MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                  : MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        } else {
          collection =
              video
                  ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI
                  : MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        }

        Uri uri = getContentResolver().insert(collection, values);
        if (uri == null) return false;
        try (OutputStream out = getContentResolver().openOutputStream(uri)) {
          if (out == null) return false;
          out.write(bytes);
        }
        if (Build.VERSION.SDK_INT >= 29) {
          values.clear();
          values.put(MediaStore.MediaColumns.IS_PENDING, 0);
          getContentResolver().update(uri, values, null, null);
        }
        runOnUiThread(
            () ->
                Toast.makeText(
                        MainActivity.this,
                        video ? "Saved to gallery" : "Saved to gallery",
                        Toast.LENGTH_SHORT)
                    .show());
        return true;
      } catch (Exception ignored) {
        return false;
      }
    }

    private String sanitize(String filename, String fallbackExt) {
      String name = filename == null ? "" : filename.trim().replaceAll("[^A-Za-z0-9._-]", "-");
      if (name.isEmpty() || ".".equals(name) || "..".equals(name)) {
        name = "jwelpixel-" + System.currentTimeMillis() + "." + fallbackExt;
      }
      if (!name.contains(".")) name = name + "." + fallbackExt;
      return name;
    }
  }
}
