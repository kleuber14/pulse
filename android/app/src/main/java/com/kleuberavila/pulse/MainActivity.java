package com.kleuberavila.pulse;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getBridge() != null) {
            getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
            getBridge().getWebView().setBackgroundColor(android.graphics.Color.rgb(7, 12, 23));
        }
    }
}
