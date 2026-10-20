package io.github.meowmeowengineer.pocketviewer;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * 다른 앱(파일 관리자, 카카오톡, 메일 등)에서 '열기' 또는 '공유'로 넘겨준 문서를 웹 화면에 전달한다.
 * content:// 주소는 이 앱에 잠깐 허락된 읽기 권한으로만 읽으며, 저장소 권한은 요청하지 않는다.
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
}
