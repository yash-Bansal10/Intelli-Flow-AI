/*
 * CameraWebServer.ino — ESP32-CAM Firmware (Intelli-Flow AI)
 *
 * Streams live MJPEG video from the OV2640 camera over WiFi.
 * The laptop backend reads frames from: http://[ESP32-CAM-IP]/stream
 * Single JPEG snapshots:              http://[ESP32-CAM-IP]/capture
 *
 * Flash using Arduino IDE:
 *   Board: "AI Thinker ESP32-CAM"  (from esp32 board package by Espressif)
 *   Partition: "Huge APP (3MB No OTA/1MB SPIFFS)"
 *
 * ⚠️  Edit WIFI_SSID and WIFI_PASSWORD below before flashing.
 *
 * After boot, the assigned IP is printed to Serial Monitor (115200 baud).
 * Set ESP32_CAM_URL = "http://<that IP>/stream" in backend/config.py
 */

#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"

// ── WiFi Credentials ─────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YourHotspotName";   // ⚠️  Edit before flash
const char* WIFI_PASSWORD = "YourHotspotPass";   // ⚠️  Edit before flash

// ── Camera Pin Config (AI-Thinker ESP32-CAM) ─────────────────────────────────
#define PWDN_GPIO_NUM  32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM   0
#define SIOD_GPIO_NUM  26
#define SIOC_GPIO_NUM  27
#define Y9_GPIO_NUM    35
#define Y8_GPIO_NUM    34
#define Y7_GPIO_NUM    39
#define Y6_GPIO_NUM    36
#define Y5_GPIO_NUM    21
#define Y4_GPIO_NUM    19
#define Y3_GPIO_NUM    18
#define Y2_GPIO_NUM     5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM  23
#define PCLK_GPIO_NUM  22

// ── MJPEG Stream Handler ──────────────────────────────────────────────────────
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* STREAM_CONTENT_TYPE =
    "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* STREAM_PART =
    "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t stream_httpd = NULL;

esp_err_t stream_handler(httpd_req_t* req) {
    camera_fb_t* fb = NULL;
    esp_err_t res = ESP_OK;
    char part_buf[64];

    res = httpd_resp_set_type(req, STREAM_CONTENT_TYPE);
    if (res != ESP_OK) return res;

    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

    while (true) {
        fb = esp_camera_fb_get();
        if (!fb) {
            Serial.println("[Camera] Frame capture failed");
            res = ESP_FAIL;
            break;
        }

        // Send boundary
        res = httpd_resp_send_chunk(req, STREAM_BOUNDARY, strlen(STREAM_BOUNDARY));
        if (res != ESP_OK) break;

        // Send part header
        size_t hlen = snprintf(part_buf, 64, STREAM_PART, fb->len);
        res = httpd_resp_send_chunk(req, part_buf, hlen);
        if (res != ESP_OK) break;

        // Send JPEG data
        res = httpd_resp_send_chunk(req, (const char*)fb->buf, fb->len);
        esp_camera_fb_return(fb);
        fb = NULL;

        if (res != ESP_OK) break;
    }

    if (fb) esp_camera_fb_return(fb);
    return res;
}

// ── Single Frame Capture Handler ──────────────────────────────────────────────
esp_err_t capture_handler(httpd_req_t* req) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
        httpd_resp_send_500(req);
        return ESP_FAIL;
    }
    httpd_resp_set_type(req, "image/jpeg");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_send(req, (const char*)fb->buf, fb->len);
    esp_camera_fb_return(fb);
    return ESP_OK;
}

// ── Start HTTP Server ─────────────────────────────────────────────────────────
void startCameraServer() {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.server_port = 80;

    httpd_uri_t stream_uri = {
        .uri       = "/stream",
        .method    = HTTP_GET,
        .handler   = stream_handler,
        .user_ctx  = NULL
    };
    httpd_uri_t capture_uri = {
        .uri       = "/capture",
        .method    = HTTP_GET,
        .handler   = capture_handler,
        .user_ctx  = NULL
    };

    if (httpd_start(&stream_httpd, &config) == ESP_OK) {
        httpd_register_uri_handler(stream_httpd, &stream_uri);
        httpd_register_uri_handler(stream_httpd, &capture_uri);
        Serial.println("[Server] HTTP server started.");
    } else {
        Serial.println("[Server] ❌ Failed to start HTTP server.");
    }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    Serial.setDebugOutput(false);
    Serial.println("\n\n[ESP32-CAM] Intelli-Flow AI Camera Node booting …");

    // Camera init
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer   = LEDC_TIMER_0;
    config.pin_d0       = Y2_GPIO_NUM;
    config.pin_d1       = Y3_GPIO_NUM;
    config.pin_d2       = Y4_GPIO_NUM;
    config.pin_d3       = Y5_GPIO_NUM;
    config.pin_d4       = Y6_GPIO_NUM;
    config.pin_d5       = Y7_GPIO_NUM;
    config.pin_d6       = Y8_GPIO_NUM;
    config.pin_d7       = Y9_GPIO_NUM;
    config.pin_xclk     = XCLK_GPIO_NUM;
    config.pin_pclk     = PCLK_GPIO_NUM;
    config.pin_vsync    = VSYNC_GPIO_NUM;
    config.pin_href     = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn     = PWDN_GPIO_NUM;
    config.pin_reset    = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    // Use PSRAM for higher resolution if available
    if (psramFound()) {
        config.frame_size   = FRAMESIZE_SVGA;   // 800×600
        config.jpeg_quality = 12;               // 0=best, 63=worst
        config.fb_count     = 2;
    } else {
        config.frame_size   = FRAMESIZE_VGA;    // 640×480 fallback
        config.jpeg_quality = 15;
        config.fb_count     = 1;
    }

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("[Camera] ❌ Init failed: 0x%x\n", err);
        return;
    }
    Serial.println("[Camera] Initialized. ✓");

    // Flip image if camera is mounted upside-down
    // sensor_t* s = esp_camera_sensor_get();
    // s->set_vflip(s, 1);
    // s->set_hmirror(s, 1);

    // Connect WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("[WiFi] Connecting");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
    Serial.println("[WiFi] ▼▼▼ Copy this into backend/config.py ▼▼▼");
    Serial.print("  ESP32_CAM_URL = \"http://");
    Serial.print(WiFi.localIP());
    Serial.println("/stream\"");

    startCameraServer();
    Serial.println("[ESP32-CAM] Ready. Stream: http://" + WiFi.localIP().toString() + "/stream");
}

void loop() {
    delay(1);   // Keep watchdog happy; server runs via RTOS tasks
}
