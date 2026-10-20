package io.github.meowmeowengineer.pocketviewer;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OpenedFilePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
