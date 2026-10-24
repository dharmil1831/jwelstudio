package com.jwelpixel.app;

import android.app.DownloadManager;
import android.net.Uri;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onResume() {
    super.onResume();
    if (getBridge() == null || getBridge().getWebView() == null) return;
    getBridge()
        .getWebView()
        .setDownloadListener(
            (url, userAgent, contentDisposition, mimetype, contentLength) -> {
              try {
                DownloadManager.Request request =
                    new DownloadManager.Request(Uri.parse(url));
                String cookie = CookieManager.getInstance().getCookie(url);
                if (cookie != null) request.addRequestHeader("Cookie", cookie);
                if (userAgent != null) request.addRequestHeader("User-Agent", userAgent);
                if (mimetype != null) request.setMimeType(mimetype);
                request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    URLUtil.guessFileName(url, contentDisposition, mimetype));
                DownloadManager manager =
                    (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                if (manager != null) manager.enqueue(request);
              } catch (RuntimeException ignored) {
                // Keep the page open if the system download manager rejects the file.
              }
            });
  }
}
