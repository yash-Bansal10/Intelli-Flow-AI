# boot.py — ESP32 Controller (MicroPython)
# This file runs FIRST on every boot. It connects to your WiFi hotspot
# and prints the assigned IP address to the serial console.
#
# Flash this file to the ESP32 using Thonny IDE or ampy:
#   ampy --port COM3 put boot.py
#
# ⚠️  EDIT these two values before flashing:
WIFI_SSID     = "First floor"    # Your mobile hotspot SSID
WIFI_PASSWORD = "Moh@3301"    # Your mobile hotspot password

import network
import time

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if wlan.isconnected():
        print("[WiFi] Already connected:", wlan.ifconfig()[0])
        return

    print(f"[WiFi] Connecting to '{WIFI_SSID}' ...")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)

    retries = 0
    while not wlan.isconnected() and retries < 20:
        time.sleep(0.5)
        retries += 1
        print(".", end="")

    print()
    if wlan.isconnected():
        ip = wlan.ifconfig()[0]
        print(f"[WiFi] Connected! IP address: {ip}")
        print(f"[WiFi] Set ESP32_CTRL_URL = 'http://{ip}' in backend/config.py")
    else:
        print("[WiFi] ❌ Failed to connect. Check SSID/password and hotspot is on.")

connect_wifi()
