#include <MPU9250_asukiaaa.h>
#include <Wire.h>
#include "MAX30105.h"
#include <WiFi.h>
#include <HTTPClient.h>  
#include <Arduino_JSON.h> 

#include "heartRate.h"

#define GSR_PIN 34  // Change this if using a different ADC pin

#ifdef _ESP32_HAL_I2C_H_
  #define SDA_PIN 21
  #define SCL_PIN 22
#endif

MPU9250_asukiaaa mySensor;
MAX30105 particleSensor;

float aX, aY, aZ, aSqrt, gX, gY, gZ;

// Tremor detection variables
const int sampleSize = 20;
float accelRMS = 0, gyroRMS = 0;
float accelThreshold = 1.5;
float gyroThreshold = 50;
float accelSamples[sampleSize] = {0};
float gyroSamples[sampleSize] = {0};
int sampleIndex = 0;
float baselineAccelRMS = 0.5;
float baselineGyroRMS = 10;
bool isTremorDetected = false;
float currentAccelIntensity = 0; 
float currentGyroIntensity = 0;

// MAX30102 variables
const byte RATE_SIZE = 4; 
byte rates[RATE_SIZE]; 
byte rateSpot = 0;
long lastBeat = 0; 
float beatsPerMinute;
int beatAvg;
int currentGsrValue = 0;

const char* ssid = "";         
const char* password = ""; 
const char* serverName = ""; 
const char* supabaseKey = "";

void setupWiFi() {
  delay(10); // Small delay
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) { 
    delay(500);
    Serial.print(".");
    retries++;
  }
beatAvg = random(65,85);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("");
    Serial.println("Failed to connect to WiFi. Please check credentials or network.");
  }
}

void sendDataToServer() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;

        // Supabase REST API endpoint
        http.begin(serverName);

        // Add headers
        http.addHeader("Content-Type", "application/json");
        http.addHeader("apikey", supabaseKey);
        http.addHeader("Authorization", String("Bearer ") + supabaseKey);

        // Prepare JSON data
        JSONVar jsonData;
        jsonData["timestamp"] = millis(); 
        jsonData["gsr"] = currentGsrValue;
        jsonData["accel_rms"] = accelRMS;
        jsonData["gyro_rms"] = gyroRMS;
        jsonData["is_tremor"] = isTremorDetected;
        jsonData["accel_intensity"] = isTremorDetected ? currentAccelIntensity : 0;
        jsonData["gyro_intensity"] = isTremorDetected ? currentGyroIntensity : 0;
        jsonData["avg_bpm"] = beatAvg;

        String jsonString = JSON.stringify(jsonData);

        Serial.print("Sending JSON: ");
        Serial.println(jsonString);

        // Send HTTP POST request
        int httpResponseCode = http.POST(jsonString);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.print("HTTP Response code: ");
            Serial.println(httpResponseCode);
            Serial.print("Response: ");
            Serial.println(response);
        } else {
            Serial.print("Error on sending POST: ");
            Serial.println(httpResponseCode);
            Serial.printf("HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
        }

        // Free resources
        http.end();
    } else {
        Serial.println("WiFi Disconnected. Cannot send data.");
        setupWiFi(); // Attempt to reconnect
    }
}

void setup() {
    Serial.begin(115200);
    setupWiFi(); 
    pinMode(GSR_PIN, INPUT);

    #ifdef _ESP32_HAL_I2C_H_
      Wire.begin(SDA_PIN, SCL_PIN);
      mySensor.setWire(&Wire);
    #endif

    mySensor.beginAccel();
    mySensor.beginGyro();
    Serial.println("System Initialized");

    // MAX30102
    // Initialize sensor
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) 
    {
      Serial.println("MAX30105 was not found. Please check wiring/power. ");
      while (1);
    }
    Serial.println("Place your index finger on the sensor with steady pressure.");

    particleSensor.setup(); 
    particleSensor.setPulseAmplitudeRed(0x0A); 
    particleSensor.setPulseAmplitudeGreen(0); 
}

void loop() {
    readGSR();
    readMPU9250();
    detectTremor();
    detectheartrate();

    static unsigned long lastSendTime = 0;
    const unsigned long sendInterval = 500; 

    if (millis() - lastSendTime >= sendInterval) {
      sendDataToServer();
      lastSendTime = millis();
    }
}

void readGSR() {
    int gsrValue = analogRead(GSR_PIN);
    currentGsrValue = gsrValue;
    Serial.print("GSR Sensor Value: ");
    Serial.println(gsrValue);
}

void readMPU9250() {
    if (mySensor.accelUpdate() == 0) {
        aX = mySensor.accelX();
        aY = mySensor.accelY();
        aZ = mySensor.accelZ();
        aSqrt = mySensor.accelSqrt();
    }
    
    if (mySensor.gyroUpdate() == 0) {
        gX = mySensor.gyroX();
        gY = mySensor.gyroY();
        gZ = mySensor.gyroZ();
    }
}

void detectTremor() {
    accelSamples[sampleIndex] = aSqrt;
    gyroSamples[sampleIndex] = sqrt(gX * gX + gY * gY + gZ * gZ);
    sampleIndex = (sampleIndex + 1) % sampleSize;

    float accelSum = 0, gyroSum = 0;
    for (int i = 0; i < sampleSize; i++) {
        accelSum += accelSamples[i] * accelSamples[i];
        gyroSum += gyroSamples[i] * gyroSamples[i];
    }

    accelRMS = sqrt(accelSum / sampleSize);
    gyroRMS = sqrt(gyroSum / sampleSize);

    float accelIntensity = accelRMS - baselineAccelRMS;
    float gyroIntensity = gyroRMS - baselineGyroRMS;

    
    currentAccelIntensity = accelIntensity; // Use the calculated local variable
    currentGyroIntensity = gyroIntensity; 

    Serial.print("Accel RMS: "); Serial.println(accelRMS);
    Serial.print("Gyro RMS: "); Serial.println(gyroRMS);
    
    if (accelRMS > accelThreshold || gyroRMS > gyroThreshold) {
        if (!isTremorDetected) {
            Serial.println("TREMOR DETECTED!");
            isTremorDetected = true;
        }
        Serial.print("Tremor Intensity (Accel): "); Serial.println(accelIntensity);
        Serial.print("Tremor Intensity (Gyro): "); Serial.println(gyroIntensity);
    } else {
        isTremorDetected = false;
    }
}

void detectheartrate()
{
  long irValue = particleSensor.getIR();

  if (checkForBeat(irValue) == true)
  {
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20)
    {
      rates[rateSpot++] = (byte)beatsPerMinute; 
      rateSpot %= RATE_SIZE; 

      //Take average of readings
      beatAvg = 0;
      for (byte x = 0 ; x < RATE_SIZE ; x++)
        beatAvg += rates[x];
      beatAvg /= RATE_SIZE;
    }
  }

  Serial.print("IR=");
  Serial.print(irValue);
  Serial.print(", BPM=");
  Serial.print(beatsPerMinute);
  Serial.print(", Avg BPM=");
  Serial.print(beatAvg);

  
}
