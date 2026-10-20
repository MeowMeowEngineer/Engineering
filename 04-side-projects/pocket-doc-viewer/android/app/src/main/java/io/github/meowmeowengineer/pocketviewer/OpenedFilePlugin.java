package io.github.meowmeowengineer.pocketviewer;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * 다른 앱(파일 관리자, 카카오톡, 메일 등)에서 '열기' 또는 '공유'로 넘겨준 문서를 웹 화면에 전달한다.
 * content:// 주소는 이 앱에 잠깐 허락된 읽기 권한으로만 읽으며, 저장소 권한은 요청하지 않는다.
 * 고친 문서는 시스템 '다른 이름으로 저장' 창(SAF)이나 공유 시트로 내보낸다. 이것도 권한이 필요 없다.
 */
@CapacitorPlugin(name = "OpenedFile")
public class OpenedFilePlugin extends Plugin {
    private static final int MAX_BYTES = 150 * 1024 * 1024;

    @PluginMethod
    public void getLaunchUri(PluginCall call) {
        JSObject ret = new JSObject();
        Uri uri = uriFrom(getActivity().getIntent());
        ret.put("uri", uri == null ? null : uri.toString());
        // 같은 문서를 다시 열지 않도록 처음 한 번만 넘긴다
        getActivity().setIntent(new Intent(Intent.ACTION_MAIN));
        call.resolve(ret);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        Uri uri = uriFrom(intent);
        if (uri == null) return;
        JSObject ret = new JSObject();
        ret.put("uri", uri.toString());
        notifyListeners("opened", ret, true);
    }

    @SuppressWarnings("deprecation")
    private static Uri uriFrom(Intent intent) {
        if (intent == null) return null;
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action)) return intent.getData();
        if (Intent.ACTION_SEND.equals(action)) return intent.getParcelableExtra(Intent.EXTRA_STREAM);
        return null;
    }

    @PluginMethod
    public void read(PluginCall call) {
        String value = call.getString("uri");
        if (value == null) {
            call.reject("파일 주소가 없습니다");
            return;
        }
        Uri uri = Uri.parse(value);
        getBridge().execute(() -> {
            try {
                byte[] bytes = readAll(uri);
                JSObject ret = new JSObject();
                ret.put("name", displayName(uri));
                ret.put("data", Base64.encodeToString(bytes, Base64.NO_WRAP));
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("파일을 읽을 수 없습니다: " + e.getMessage());
            }
        });
    }

    private byte[] readAll(Uri uri) throws IOException {
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
            if (in == null) throw new IOException("열 수 없는 주소입니다");
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[64 * 1024];
            int total = 0;
            int n;
            while ((n = in.read(buf)) != -1) {
                total += n;
                if (total > MAX_BYTES) throw new IOException("파일이 너무 큽니다 (150MB 초과)");
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }

    private String displayName(Uri uri) {
        if ("content".equals(uri.getScheme())) {
            try (Cursor c = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
                if (c != null && c.moveToFirst()) {
                    String name = c.getString(0);
                    if (name != null && !name.isEmpty()) return name;
                }
            } catch (Exception ignored) {
                // 이름을 못 얻어도 내용으로 형식을 판별하므로 계속 진행한다
            }
        }
        String last = uri.getLastPathSegment();
        return last != null ? last : "문서";
    }

    // ------------------------------------------------------------------ 저장·공유

    /** 시스템 저장 창을 띄우고, 사용자가 고른 위치에 바이트를 쓴다 */
    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("name", "문서");
        String mime = call.getString("mime", "application/octet-stream");
        if (call.getString("data") == null) {
            call.reject("저장할 내용이 없습니다");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mime);
        intent.putExtra(Intent.EXTRA_TITLE, name);
        startActivityForResult(call, intent, "saveResult");
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject ret = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            ret.put("saved", false);
            call.resolve(ret);
            return;
        }
        Uri uri = result.getData().getData();
        byte[] bytes = Base64.decode(call.getString("data"), Base64.DEFAULT);
        getBridge().execute(() -> {
            try (OutputStream out = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new IOException("저장 위치를 열 수 없습니다");
                out.write(bytes);
                ret.put("saved", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("저장하지 못했습니다: " + e.getMessage());
            }
        });
    }

    /** 앱 전용 임시 폴더에 쓰고, 읽기 권한만 붙여 공유 시트로 넘긴다 */
    @PluginMethod
    public void share(PluginCall call) {
        String name = call.getString("name", "문서");
        String mime = call.getString("mime", "application/octet-stream");
        String data = call.getString("data");
        if (data == null) {
            call.reject("공유할 내용이 없습니다");
            return;
        }
        try {
            File dir = new File(getContext().getCacheDir(), "shared");
            if (!dir.exists() && !dir.mkdirs()) throw new IOException("임시 폴더를 만들 수 없습니다");
            File file = new File(dir, name.replaceAll("[\\\\/:*?\"<>|]", "_"));
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(Base64.decode(data, Base64.DEFAULT));
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(mime);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, name);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("공유하지 못했습니다: " + e.getMessage());
        }
    }
}
