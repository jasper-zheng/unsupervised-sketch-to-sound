#include "Arduino_JSON.h"
#include <Trill.h>

Trill trillSquare;
boolean touchActive = false;
boolean sendRaw = false;
const boolean verbose = true; // set this to false to communicate to the Processing GUI via UART.

int rawIn[30];
int h_touch[4];
int v_touch[4];
int data;
String command;
String receivedStr;
String sendStr = "";
JSONVar event;

const int potPin = A0;

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  
  if(trillSquare.setup(Trill::TRILL_SQUARE) != 0){
    Serial.println("failed to initialise trill square");
  }
  trillSquare.setMode(Trill::DIFF);

  event[0] = "event-from-arduino";
}



void loop() {
  // Check for new serial data every loop

  delay(10);
  
  // int sensorValue = analogRead(potPin);
  // Serial.println(sensorValue); 
  trillSquare.requestRawData();
  if(trillSquare.rawDataAvailable() > 0) {
    printRawData(trillSquare);
  }

}


void printRawData(Trill & trill) {

  for (int i = 0; i<4; i++){
    h_touch[i] = 0;
    v_touch[i] = 0;
  }


  int i = 0;
  int h_touch_num = 0;
  int v_touch_num = 0;
  


  while(trill.rawDataAvailable() > 0){
    data = trill.rawDataRead();
    rawIn[i] = data;
    i++;
  }
  for (int i = 0; i < 30; i++){
    if (i<4 && rawIn[i+4]>=120){
      h_touch[h_touch_num] = rawIn[i];
      h_touch_num++;
    }
    if (i>=8 && i<12 && rawIn[i+4]>=120){
      v_touch[v_touch_num] = rawIn[i];
      v_touch_num++;
    }
  }

  if (sendRaw){
    for (int i = 0; i < 4; i++){
      if(v_touch[i] < 1000)
        Serial.print(0);
      if(v_touch[i] < 100)
        Serial.print(0);
      if(v_touch[i] < 10)
        Serial.print(0);
      Serial.print(v_touch[i]);
      Serial.print(" ");
    }
    Serial.print(" - ");
    for (int i = 0; i < 4; i++){
      if(h_touch[i] < 1000)
        Serial.print(0);
      if(h_touch[i] < 100)
        Serial.print(0);
      if(h_touch[i] < 10)
        Serial.print(0);
      Serial.print(h_touch[i]);
      Serial.print(" ");
    }
    Serial.print(" -  ");
  }
  receivedStr = "";
  sendStr = "";
  if(Serial.available() > 0){
    receivedStr = Serial.readStringUntil('\n');
    receivedStr.trim();

    if (receivedStr.equals("[\"event\",1]")){
      
      int sensorValue = analogRead(potPin);
      // Serial.println(sensorValue); 
      sendStr = String(sendStr + sensorValue + ":");
      if (v_touch_num==h_touch_num){
        for (int i = 0; i < v_touch_num; i++){
          sendStr = String(sendStr + v_touch[i] + "," + h_touch[i] + "_");
        }
      }
      if (v_touch_num>h_touch_num){
        for (int i = 0; i < v_touch_num; i++){
          if (i>=h_touch_num){
            sendStr = String(sendStr + v_touch[i] + "," + h_touch[h_touch_num-1] + "_");
          } else {
            sendStr = String(sendStr + v_touch[i] + "," + h_touch[i] + "_");
          }
        }
      }
      if (v_touch_num<h_touch_num){
        for (int i = 0; i < h_touch_num; i++){
          if (i>=v_touch_num){
            sendStr = String(sendStr + v_touch[v_touch_num-1] + "," + h_touch[i] + "_");
          } else {
            sendStr = String(sendStr + v_touch[i] + "," + h_touch[i] + "_");
          }
        }
      }
      
      event[1] = sendStr;
      Serial.println(JSON.stringify(event));
      

    }
  }
}