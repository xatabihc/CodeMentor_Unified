package com.codementor.offline;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Rect;
import android.widget.FrameLayout;
import org.json.JSONObject;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int FILE_PICK = 101;
    private static final int FILE_SAVE = 102;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String exportContent;
    private String exportFilename;
    private static final String ORIGIN = "https://appassets.androidplatform.net";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            // Keep system bars visible; the native container owns their safe area.
            getWindow().setDecorFitsSystemWindows(false);
        }
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        // Existing installations may already have an offline service worker.
        // Route its requests to the same packaged assets so updates can refresh it.
        android.webkit.ServiceWorkerController.getInstance().setServiceWorkerClient(new android.webkit.ServiceWorkerClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                WebResourceResponse response = loader.shouldInterceptRequest(request.getUrl());
                if (response != null) return response;
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden",
                        java.util.Collections.emptyMap(), new java.io.ByteArrayInputStream(new byte[0]));
            }
        });
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        webView.addJavascriptInterface(new ExportBridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = loader.shouldInterceptRequest(request.getUrl());
                if (response != null) return response;
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden",
                        java.util.Collections.emptyMap(), new java.io.ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return true;
                Uri uri = request.getUrl();
                if (ORIGIN.equals(uri.getScheme()+"://"+uri.getHost()) && uri.getPath()!=null && uri.getPath().startsWith("/assets/")) return false;
                if (!"https".equals(uri.getScheme()) && !"http".equals(uri.getScheme())) return true;
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                catch (ActivityNotFoundException e) { Toast.makeText(MainActivity.this,"Нет приложения для открытия ссылки",Toast.LENGTH_LONG).show(); }
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if(fileCallback!=null)fileCallback.onReceiveValue(null);
                fileCallback=callback;
                try { startActivityForResult(params.createIntent(), FILE_PICK); }
                catch(Exception ex){fileCallback=null;callback.onReceiveValue(null);return false;}
                return true;
            }
        });
        FrameLayout content = new FrameLayout(this);
        content.setBackgroundColor(Color.WHITE);
        content.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(content);
        installContentInsets(content);
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS);
            }
        }
        webView.loadUrl(ORIGIN+"/assets/index.html");
    }
    private void installContentInsets(FrameLayout content) {
        // Padding belongs to a real ViewGroup, not WebView's HTML viewport.
        content.setOnApplyWindowInsetsListener((view, insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                int safeTypes = WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout();
                int handled = safeTypes | WindowInsets.Type.ime();
                Insets safe = insets.getInsets(safeTypes);
                Insets ime = insets.getInsets(WindowInsets.Type.ime());
                content.setPadding(safe.left, safe.top, safe.right, Math.max(safe.bottom, ime.bottom));
                // Send zeroed updates, including keyboard-hide, to avoid double/ghost padding.
                return new WindowInsets.Builder(insets)
                        .setInsets(handled, Insets.NONE)
                        .setInsetsIgnoringVisibility(safeTypes, Insets.NONE)
                        .setDisplayCutout(null)
                        .build();
            }
            // API 26-29: decor fitting/adjustResize may already exclude bars or IME.
            // Account only for overlap with the remaining visible frame, never twice.
            if (content.getWidth() > 0 && content.getHeight() > 0) {
                Rect visible = new Rect();
                content.getWindowVisibleDisplayFrame(visible);
                int[] position = new int[2];
                content.getLocationOnScreen(position);
                if (android.os.Build.VERSION.SDK_INT >= 28 && insets.getDisplayCutout() != null) {
                    android.view.DisplayCutout cutout = insets.getDisplayCutout();
                    android.view.View decor = getWindow().getDecorView();
                    int[] origin = new int[2];
                    decor.getLocationOnScreen(origin);
                    visible.left = Math.max(visible.left, origin[0] + cutout.getSafeInsetLeft());
                    visible.top = Math.max(visible.top, origin[1] + cutout.getSafeInsetTop());
                    visible.right = Math.min(visible.right, origin[0] + decor.getWidth() - cutout.getSafeInsetRight());
                    visible.bottom = Math.min(visible.bottom, origin[1] + decor.getHeight() - cutout.getSafeInsetBottom());
                }
                int[] padding = SafeArea.padding(position[0], position[1], content.getWidth(), content.getHeight(),
                        visible.left, visible.top, visible.right, visible.bottom);
                content.setPadding(padding[0], padding[1], padding[2], padding[3]);
            }
            if (android.os.Build.VERSION.SDK_INT >= 29) {
                return new WindowInsets.Builder(insets).setSystemWindowInsets(Insets.NONE)
                        .setStableInsets(Insets.NONE).setDisplayCutout(null).build();
            }
            // Legacy equivalent of a zeroed (not CONSUMED) inset notification.
            WindowInsets zeroed = insets.replaceSystemWindowInsets(0, 0, 0, 0).consumeStableInsets();
            return android.os.Build.VERSION.SDK_INT >= 28 ? zeroed.consumeDisplayCutout() : zeroed;
        });
        content.addOnLayoutChangeListener((view, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> {
            if (left != oldLeft || top != oldTop || right != oldRight || bottom != oldBottom) {
                view.requestApplyInsets();
            }
        });
        content.requestApplyInsets();
    }
    private boolean validProgress(JSONObject data) throws Exception {
        Object version = data.get("version");
        if (!(version instanceof Number) || ((Number) version).doubleValue() != 1) return false;
        JSONObject records = data.getJSONObject("records");
        if (records.length() > 1000) return false;
        java.util.Iterator<String> keys = records.keys();
        while (keys.hasNext()) {
            String id = keys.next();
            if (id.isEmpty() || id.length() > 100) return false;
            JSONObject record = records.getJSONObject(id);
            Object draft = record.get("draft");
            if (draft != JSONObject.NULL && (!(draft instanceof String) || ((String) draft).length() > 12000)) return false;
            Object completed = record.get("completed");
            if (!(completed instanceof Boolean) && !(completed instanceof Number && (((Number) completed).doubleValue() == 0 || ((Number) completed).doubleValue() == 1))) return false;
            for (String field : new String[]{"attempts", "hint_level"}) {
                Object value = record.get(field);
                if (!(value instanceof Number)) return false;
                double number = ((Number) value).doubleValue();
                if (!Double.isFinite(number) || number != Math.floor(number) || number < 0 || number > (field.equals("attempts") ? 10000000 : 2)) return false;
            }
            Object date = record.opt("completed_at");
            if (date != null && date != JSONObject.NULL && (!(date instanceof String) || ((String) date).length() > 100)) return false;
        }
        return true;
    }
    class ExportBridge {
        @JavascriptInterface public String loadProgress() {
            return getSharedPreferences("codementor", MODE_PRIVATE).getString("progress", null);
        }
        @JavascriptInterface public String loadProgressBackup() {
            return getSharedPreferences("codementor", MODE_PRIVATE).getString("progress_backup", null);
        }
        @JavascriptInterface public boolean saveProgress(String content) {
            if (content == null || content.length() > 5_000_000) return false;
            try {
                JSONObject data = new JSONObject(content);
                if (!validProgress(data)) return false;
                // commit acknowledges the private-file write before the UI reports success.
                android.content.SharedPreferences prefs = getSharedPreferences("codementor", MODE_PRIVATE);
                android.content.SharedPreferences.Editor edit = prefs.edit();
                String previous = prefs.getString("progress", null);
                if (previous != null && !previous.equals(content)) {
                    try {
                        JSONObject old = new JSONObject(previous);
                        if (validProgress(old)) {
                            edit.putString("progress_backup", previous);
                        }
                    } catch (Exception ignored) { /* Keep the last readable backup. */ }
                }
                return edit.putString("progress", content).commit();
            } catch (Exception e) { return false; }
        }
        @JavascriptInterface public void saveJson(String filename, String content) {
            if(content==null || content.length()>5_000_000)return;
            runOnUiThread(() -> {
                exportContent=content;
                exportFilename=(filename!=null && filename.matches("[a-zA-Z0-9._-]{1,100}"))?filename:"codementor-progress.json";
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE,exportFilename);
                try { startActivityForResult(intent,FILE_SAVE); }
                catch (ActivityNotFoundException e) {
                    exportContent=null;
                    Toast.makeText(MainActivity.this,"Нет приложения для сохранения документа",Toast.LENGTH_LONG).show();
                }
            });
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request,result,data);
        if(request==FILE_PICK){
            if(fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}
        } else if(request==FILE_SAVE && result==RESULT_OK && data!=null && data.getData()!=null){
            try(OutputStream out=getContentResolver().openOutputStream(data.getData())){
                if(out!=null && exportContent!=null){out.write(exportContent.getBytes(StandardCharsets.UTF_8));Toast.makeText(this,"Прогресс сохранён",Toast.LENGTH_SHORT).show();}
            }catch(Exception e){Toast.makeText(this,"Ошибка сохранения: "+e.getMessage(),Toast.LENGTH_LONG).show();}
            finally{exportContent=null;}
        }
    }
    @Override public void onBackPressed(){if(webView.canGoBack())webView.goBack();else super.onBackPressed();}
    @Override protected void onDestroy(){if(webView!=null)webView.destroy();super.onDestroy();}
}
